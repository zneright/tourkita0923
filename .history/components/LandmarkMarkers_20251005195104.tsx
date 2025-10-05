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

                    // --- Compute this week's Monday–Sunday ---
                    const day = today.getDay(); // 0 = Sun, 1 = Mon, ...
                    const diff = day === 0 ? -6 : 1 - day;
                    const monday = new Date(today);
                    monday.setDate(today.getDate() + diff);
                    monday.setHours(0, 0, 0, 0);

                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    sunday.setHours(23, 59, 59, 999);

                    const fetched: any[] = [];

                    for (const docSnap of snapshot.docs) {
                        const data = docSnap.data();
                        const recurrence = data.recurrence || {};
                        const freq = recurrence.frequency || "once";

                        let startDate: Date | null = null;
                        let endDate: Date | null = null;

                        // --- Parse recurrence dates ---
                        if (recurrence.startDate) startDate = parseISO(recurrence.startDate);
                        if (recurrence.endDate && recurrence.endDate.trim() !== "")
                            endDate = parseISO(recurrence.endDate);

                        // --- Fallback to event-level dates if recurrence is empty ---
                        if (!startDate && data.startDate) startDate = parseISO(data.startDate);
                        if (!endDate && data.endDate) endDate = parseISO(data.endDate);

                        if (!startDate) continue;

                        let showEvent = false;

                        // ✅ ONCE EVENTS: If any part overlaps this week
                        if (freq === "once") {
                            const overlapsThisWeek =
                                (startDate <= sunday && (!endDate || endDate >= monday)) ||
                                (endDate && isWithinInterval(endDate, { start: monday, end: sunday }));
                            if (overlapsThisWeek) showEvent = true;
                        }

                        // ✅ WEEKLY EVENTS: If they are active this week
                        if (freq === "weekly") {
                            const inRange = isWithinInterval(today, {
                                start: startDate,
                                end: endDate || today,
                            });
                            const occursThisWeek = recurrence.daysOfWeek?.length > 0;
                            if (inRange && occursThisWeek) showEvent = true;
                        }

                        if (!showEvent) continue;

                        // --- Coordinates ---
                        let lat = data.lat;
                        let lng = data.lng;

                        if ((!lat || !lng) && data.locationId) {
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

                    // ✅ Group events by address/location
                    const groupedEvents: Record<string, any[]> = {};
                    for (const event of fetched) {
                        const key =
                            event.customAddress?.trim() ||
                            event.locationId?.toString() ||
                            `${event.latitude}-${event.longitude}`;
                        if (!groupedEvents[key]) groupedEvents[key] = [];
                        groupedEvents[key].push(event);
                    }

                    // ✅ Only one marker per group
                    const groupedMarkers = Object.values(groupedEvents).map((events: any[]) => ({
                        ...events[0],
                        groupedEvents: events,
                    }));

                    setLandmarks(groupedMarkers);
                }
            } catch (err) {
                console.error("Failed to fetch landmarks/events:", err);
            } finally {
                onLoadingChange(false);
            }
        };

        fetchData();
    }, [selectedCategory]);

    // ✅ Updated onPointPress
    const onPointPress = async (event: OnPressEvent) => {
        try {
            const landmarkStr = event.features[0].properties?.landmark;
            if (!landmarkStr) return;
            const landmark = JSON.parse(landmarkStr);

            if (selectedCategory === "Events" || landmark.category === "Event") {
                // Check if this marker has grouped events
                if (landmark.groupedEvents?.length > 1) {
                    setEventsAtLocation(landmark.groupedEvents);
                    setShowEventListModal(true);
                } else {
                    const evt = landmark.groupedEvents?.[0] || landmark;
                    setSelectedEvent(evt);
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