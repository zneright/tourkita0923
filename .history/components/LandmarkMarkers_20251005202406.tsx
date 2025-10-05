import { CircleLayer, Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { OnPressEvent } from "@rnmapbox/maps/lib/typescript/src/types/OnPressEvent";
import { featureCollection, point } from "@turf/helpers";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLandmark } from "../provider/LandmarkProvider";
import EventListModal from "../components/EventListModal";

import EventListModal from "./EventListModal";

import pin from "../assets/pinB.png";
import restroom from "../assets/restroom.png";
import museum from "../assets/museum.png";
import historical from "../assets/historical.png";
import government from "../assets/government.png";
import park from "../assets/park.png";
import food from "../assets/food.png";
import school from "../assets/school.png";
import eventIcon from "../assets/events.png";

import { format, isWithinInterval, parseISO } from "date-fns";
export default function LandmarkMarkers({ selectedCategory, onLoadingChange }: any) {
    const { setSelectedLandmark, loadDirection } = useLandmark();
    const [landmarks, setLandmarks] = useState<any[]>([]);
    const [eventsAtLocation, setEventsAtLocation] = useState<any[]>([]);
    const [showEventListModal, setShowEventListModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                onLoadingChange(true);
                if (selectedCategory === "Events") {
                    const snapshot = await getDocs(collection(db, "events"));
                    const now = new Date();
                    const today = format(now, "EEE").toLowerCase();
                    const todayDate = now;
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    const fetched: any[] = [];

                    for (const docSnap of snapshot.docs) {
                        const data = docSnap.data();
                        const recurrence = data.recurrence || {};

                        const startDate = recurrence.startDate
                            ? parseISO(recurrence.startDate)
                            : data.startDate
                                ? parseISO(data.startDate)
                                : null;
                        const endDate = recurrence.endDate
                            ? parseISO(recurrence.endDate)
                            : data.endDate
                                ? parseISO(data.endDate)
                                : null;

                        // Skip if outside current month
                        if (startDate && (startDate.getMonth() !== currentMonth || startDate.getFullYear() !== currentYear)) {
                            continue;
                        }

                        // Determine if this event occurs today
                        let occursToday = false;
                        if (recurrence.frequency === "weekly") {
                            const isInDateRange =
                                startDate && endDate
                                    ? isWithinInterval(todayDate, { start: startDate, end: endDate })
                                    : true;
                            occursToday = recurrence.daysOfWeek?.includes(today) && isInDateRange;
                        } else if (recurrence.frequency === "once") {
                            occursToday = format(todayDate, "yyyy-MM-dd") === format(startDate, "yyyy-MM-dd");
                        }

                        // Get coordinates
                        let lat = data.lat;
                        let lng = data.lng;

                        if ((!data.customAddress || data.customAddress.trim() === "") && data.locationId) {
                            try {
                                const markerDoc = await getDoc(doc(db, "markers", String(data.locationId)));
                                if (markerDoc.exists()) {
                                    const marker = markerDoc.data();
                                    lat = parseFloat(marker.latitude);
                                    lng = parseFloat(marker.longitude);
                                }
                            } catch (e) {
                                console.error("Error fetching marker for event:", e);
                            }
                        }

                        fetched.push({
                            ...data,
                            latitude: lat,
                            longitude: lng,
                            category: "Event",
                            occursToday,
                        });
                    }

                    setLandmarks(fetched);
                }
                else {
                    const snapshot = await getDocs(collection(db, "markers"));
                    const fetched = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            ...data,
                            latitude: parseFloat(data.latitude),
                            longitude: parseFloat(data.longitude),
                            accessibleRestroom:
                                data.accessibleRestroom === true || data.accessibleRestroom === "true",
                        };
                    });
                    setLandmarks(fetched);
                }
            } catch (err) {
                console.error("Failed to fetch landmarks/events:", err);
            } finally {
                onLoadingChange(false);
            }
        };

        fetchData();
    }, [selectedCategory]);

    const filtered = landmarks.filter((l) => {
        if (selectedCategory === "All") return true;
        if (selectedCategory === "Restroom") return l.accessibleRestroom === true;
        if (selectedCategory === "Events") return true;
        return l.category === selectedCategory || l.categoryOption === selectedCategory;
    });

    const getIconKey = (landmark: any) => {
        if (selectedCategory === "Events" || landmark.category === "Event") return "event";

        const name = landmark.name?.toLowerCase() || "";
        const category = (landmark.category || "").toLowerCase();
        const option = (landmark.categoryOption || "").toLowerCase();

        if (selectedCategory === "Restroom" && landmark.accessibleRestroom) return "restroom";
        if (name.includes("museum") || category === "museum") return "museum";
        if (name.includes("historical") || category === "historical") return "historical";
        if (name.includes("government") || category === "government") return "government";
        if (name.includes("park") || category === "park") return "park";
        if (name.includes("food") || category === "food") return "food";
        if (name.includes("school") || category === "school") return "school";
        return "pin";
    };

    const points = filtered.map((landmark, index) =>
        point([landmark.longitude, landmark.latitude], {
            landmark: JSON.stringify(landmark),
            id: index,
            iconKey: getIconKey(landmark),
            isToday: landmark.category === "Event" ? landmark.occursToday || false : false,
        })
    );


    const onPointPress = async (event: OnPressEvent) => {
        try {
            const landmarkStr = event.features[0].properties?.landmark;
            if (!landmarkStr) return;
            const landmark = JSON.parse(landmarkStr);

            // ✅ Use EventListModal only for Events
            if (selectedCategory === "Events" || landmark.category === "Event") {
                const eventsHere = landmarks.filter(
                    (l) =>
                        l.category === "Event" &&
                        parseFloat(l.latitude) === parseFloat(landmark.latitude) &&
                        parseFloat(l.longitude) === parseFloat(landmark.longitude)
                );

                // Multiple events at same location → show modal list
                if (eventsHere.length > 1) {
                    setEventsAtLocation(eventsHere);
                    setShowEventListModal(true);
                    return;
                }

                // Single event → open details
                if (eventsHere.length === 1) {
                    const evt = eventsHere[0];

                    // fetch address if needed
                    if (!evt.customAddress && evt.locationId) {
                        try {
                            const markerDoc = await getDoc(doc(db, "markers", String(evt.locationId)));
                            if (markerDoc.exists()) {
                                evt.address = markerDoc.data().address || "";
                            } else {
                                evt.address = "";
                            }
                        } catch (e) {
                            console.error("Error fetching marker address:", e);
                            evt.address = "";
                        }
                    } else {
                        evt.address = evt.customAddress || "";
                    }

                    setSelectedEvent(evt);
                    return;
                }

                return; // no matching events
            }

            setSelectedLandmark(landmark);
        } catch (error) {
            console.error("Error parsing landmark data:", error);
        }
    };




    return (
        <>
            <Images
                images={{
                    pin: require("../assets/pinB.png"),
                    restroom: require("../assets/restroom.png"),
                    museum: require("../assets/museum.png"),
                    historical: require("../assets/historical.png"),
                    government: require("../assets/government.png"),
                    park: require("../assets/park.png"),
                    food: require("../assets/food.png"),
                    school: require("../assets/school.png"),
                    event: require("../assets/events.png"),
                }}
            />

            <ShapeSource id="landmarks" shape={featureCollection(points)} onPress={onPointPress}>
                {selectedCategory === "Events" && (
                    <CircleLayer
                        id="event-today-highlight"
                        style={{
                            circleColor: "#ff6600",
                            circleRadius: 12,
                            circleBlur: 1,
                            circleOpacity: 0.5,
                        }}
                        filter={["==", ["get", "isToday"], true]}
                    />
                )}

                <SymbolLayer
                    id="landmark-icons"
                    style={{
                        iconImage: ["get", "iconKey"],
                        iconSize: 0.09,
                        iconAllowOverlap: true,
                        iconAnchor: "bottom",
                    }}
                />
            </ShapeSource>

            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}


            {showEventListModal && (
                <EventListModal
                    events={eventsAtLocation}
                    onClose={() => setShowEventListModal(false)}
                    onSelect={(event) => {
                        setSelectedEvent(event);
                        setShowEventListModal(false);
                    }}
                />
            )}
        </>
    );
}