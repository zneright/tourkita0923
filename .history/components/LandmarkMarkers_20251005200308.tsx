import { CircleLayer, Images, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { OnPressEvent } from "@rnmapbox/maps/lib/typescript/src/types/OnPressEvent";
import { featureCollection, point } from "@turf/helpers";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLandmark } from "../provider/LandmarkProvider";
import EventDetailModal from "./EventDetailModal";
import EventListModal from "./EventListModal";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

import pin from "../assets/pinB.png";
import restroom from "../assets/restroom.png";
import museum from "../assets/museum.png";
import historical from "../assets/historical.png";
import government from "../assets/government.png";
import park from "../assets/park.png";
import food from "../assets/food.png";
import school from "../assets/school.png";
import eventIcon from "../assets/events.png";

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
                    const monthStart = startOfMonth(today);
                    const monthEnd = endOfMonth(today);

                    const fetched: any[] = [];

                    for (const docSnap of snapshot.docs) {
                        const data = docSnap.data();
                        const recurrence = data.recurrence || {};
                        const freq = recurrence.frequency || "once";

                        let startDate: Date | null = null;
                        let endDate: Date | null = null;

                        if (recurrence.startDate) startDate = parseISO(recurrence.startDate);
                        if (recurrence.endDate && recurrence.endDate.trim() !== "")
                            endDate = parseISO(recurrence.endDate);

                        if (!startDate && data.startDate) startDate = parseISO(data.startDate);
                        if (!endDate && data.endDate) endDate = parseISO(data.endDate);

                        if (!startDate) continue;

                        // ✅ Include all events this month
                        const inThisMonth =
                            isWithinInterval(startDate, { start: monthStart, end: monthEnd }) ||
                            (endDate && isWithinInterval(endDate, { start: monthStart, end: monthEnd })) ||
                            (startDate < monthStart && endDate && endDate > monthEnd);

                        if (!inThisMonth) continue;

                        // ✅ Check if it's happening today
                        const isTodayEvent =
                            isWithinInterval(today, {
                                start: startDate,
                                end: endDate || startDate,
                            });

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
                            isToday: isTodayEvent,
                        });
                    }

                    // ✅ Group by address or location
                    const grouped: Record<string, any[]> = {};
                    for (const e of fetched) {
                        const key =
                            e.customAddress?.trim() ||
                            e.locationId?.toString() ||
                            `${e.latitude}-${e.longitude}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(e);
                    }

                    const groupedMarkers = Object.values(grouped).map((events: any[]) => ({
                        ...events[0],
                        groupedEvents: events,
                    }));

                    setLandmarks(groupedMarkers);
                }
            } catch (err) {
                console.error("Failed to fetch events:", err);
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

    // 🗓️ Get start and end of this week (Mon–Sun)
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // 🟡 Filter only events happening this week
    const weeklyEvents = filtered.filter(
        (l) =>
            l.category === "Event" &&
            l.startDate &&
            isWithinInterval(parseISO(l.startDate), { start: startOfWeek, end: endOfWeek })
    );




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

            <ShapeSource
                id="event-week-highlight"
                shape={featureCollection(
                    filtered
                        .filter(
                            (l) =>
                                l.category === "Event" &&
                                isWithinInterval(new Date(), {
                                    start: startOfWeek,
                                    end: endOfWeek,
                                })
                        )
                        .map((l) => point([l.longitude, l.latitude]))
                )}
            >

                <CircleLayer
                    id="event-week-circle"
                    style={{
                        circleRadius: 18,
                        circleColor: "#FFD700",
                        circleOpacity: 0.5,
                        circleBlur: 0.7,
                    }}
                />
            </ShapeSource>

            {/* Regular markers */}
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
                <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
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