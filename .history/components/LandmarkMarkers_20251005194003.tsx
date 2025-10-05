import { CircleLayer, Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { OnPressEvent } from "@rnmapbox/maps/lib/typescript/src/types/OnPressEvent";
import { featureCollection, point } from "@turf/helpers";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLandmark } from "../provider/LandmarkProvider";
import EventDetailModal from "./EventDetailModal";
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
                    const today = new Date();

                    // Get the current week's Monday and Sunday
                    const day = today.getDay(); // 0 = Sunday, 1 = Monday
                    const monday = new Date(today);
                    monday.setDate(today.getDate() - ((day + 6) % 7)); // go back to Monday
                    monday.setHours(0, 0, 0, 0);

                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);

                    const fetched: any[] = [];

                    for (const docSnap of snapshot.docs) {
                        const data = docSnap.data();

                        // ✅ Parse dateStart / dateEnd safely
                        const start =
                            data.dateStart
                                ? (typeof data.dateStart === "string" ? parseISO(data.dateStart) : data.dateStart.toDate())
                                : null;
                        const end =
                            data.dateEnd
                                ? (typeof data.dateEnd === "string" ? parseISO(data.dateEnd) : data.dateEnd.toDate())
                                : null;

                        // ✅ Only include events happening within this week
                        const isInThisWeek =
                            start && end
                                ? isWithinInterval(start, { start: monday, end: sunday }) ||
                                isWithinInterval(end, { start: monday, end: sunday }) ||
                                (start <= monday && end >= sunday) // ongoing all week
                                : start
                                    ? isWithinInterval(start, { start: monday, end: sunday })
                                    : false;

                        if (!isInThisWeek) continue;

                        let lat = data.lat;
                        let lng = data.lng;

                        // fallback to marker location if missing customAddress
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
                        });
                    }

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
        })
    );

    const onPointPress = async (event: OnPressEvent) => {
        try {
            const landmarkStr = event.features[0].properties?.landmark;
            if (!landmarkStr) return;
            const landmark = JSON.parse(landmarkStr);

            if (selectedCategory === "Events" || landmark.category === "Event") {
                const eventsHere = landmarks.filter(
                    (l) =>
                        l.category === "Event" &&
                        parseFloat(l.latitude) === parseFloat(landmark.latitude) &&
                        parseFloat(l.longitude) === parseFloat(landmark.longitude)
                );

                if (eventsHere.length === 1) {
                    const evt = eventsHere[0];

                    if (evt.customAddress) {
                        setSelectedEvent(evt);
                        return;
                    }

                    if (!evt.customAddress && evt.locationId) {
                        try {
                            const markerDoc = await getDoc(doc(db, "markers", String(evt.locationId)));
                            if (markerDoc.exists()) {
                                evt.address = markerDoc.data().address || "";
                            }
                        } catch (e) {
                            console.error("Error fetching marker address:", e);
                            evt.address = "";
                        }
                    }

                    setSelectedEvent(evt);
                } else if (eventsHere.length > 1) {
                    setEventsAtLocation(eventsHere);
                    setShowEventListModal(true);
                }
            } else {

                setSelectedLandmark(landmark);
            }
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