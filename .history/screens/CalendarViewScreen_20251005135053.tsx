import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import { format, parseISO, isWithinInterval, getDay } from "date-fns";
import TopHeader from "../components/TopHeader";
import EventDetailModal from "../components/EventDetailModal";
import SkeletonBox from "../components/Skeleton";

const weekdayMap: { [key: string]: number } = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
};

function isEventOnDate(event: Event, targetDate: Date): boolean {
    if (!event.startDate) return false;

    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate || event.startDate);

    const inRange = isWithinInterval(targetDate, { start, end });

    if (event.recurrence?.frequency === "weekly" && event.recurrence?.daysOfWeek?.length) {
        const recurrenceDays = event.recurrence.daysOfWeek
            .map((d) => weekdayMap[d.toLowerCase()])
            .filter((v) => v !== undefined);

        const day = getDay(targetDate);
        return (
            targetDate >= start &&
            targetDate <= end &&
            recurrenceDays.includes(day)
        );
    }

    return inRange;
}

type Event = {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    locationId?: string;
    address: string;
    eventStartTime?: string;
    eventEndTime?: string;
    startDate?: string;
    endDate?: string;
    openToPublic?: boolean;
    recurrence?: {
        frequency?: string;
        daysOfWeek?: string[];
    };
    lat?: number | null;
    lng?: number | null;
    customAddress?: string;
};


const CalendarViewScreen = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    const todayStr = format(new Date(), "yyyy-MM-dd");

    const today = new Date();

    const todaysEvents = events
        .filter((e) => isEventOnDate(e, today))
        .sort((a, b) => (a.eventStartTime || "").localeCompare(b.eventStartTime || ""));


    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const eventSnap = await getDocs(collection(db, "events"));
                const markerSnap = await getDocs(collection(db, "markers"));

                const markerMap: { [id: string]: string } = {};
                markerSnap.forEach((doc) => {
                    const data = doc.data();
                    markerMap[doc.id] = data.name || "Unknown Location";
                });

                const fetchedEvents: Event[] = [];
                const dateMap: any = {};

                eventSnap.forEach((doc) => {
                    const data = doc.data();

                    // Resolve address
                    let address = "Address not available";
                    if (data.customAddress?.trim()) {
                        address = data.customAddress;
                    } else if (data.locationId && markerMap[data.locationId]) {
                        address = markerMap[data.locationId];
                    }

                    const startDate = data.startDate ?? data.date ?? "";
                    const endDate = data.endDate ?? startDate;

                    const event: Event = {
                        id: doc.id,
                        title: data.title ?? "Untitled Event",
                        description: data.description ?? "",
                        imageUrl: data.imageUrl ?? undefined,
                        locationId: data.locationId,
                        address: data.customAddress?.trim() || markerMap[data.locationId] || "Address not available",
                        customAddress: data.customAddress ?? "",
                        eventStartTime: data.eventStartTime ?? "",
                        eventEndTime: data.eventEndTime ?? "",
                        startDate: data.startDate ?? data.date ?? "",
                        endDate: data.endDate ?? data.startDate ?? data.date ?? "",
                        openToPublic: data.openToPublic ?? false,
                        recurrence: data.recurrence || {},
                        lat: data.lat ?? null,
                        lng: data.lng ?? null,
                    };

                    fetchedEvents.push(event);

                    let current = parseISO(startDate);
                    const finalDate = parseISO(endDate);
                    while (current <= finalDate) {
                        const dayStr = format(current, "yyyy-MM-dd");
                        dateMap[dayStr] = { marked: true, dotColor: "#493628" };
                        current.setDate(current.getDate() + 1);
                    }
                });

                setEvents(fetchedEvents);
                setMarkedDates(dateMap);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const onDayPress = (day: any) => {
        const selected = parseISO(day.dateString);

        const filtered = events.filter((e) => isEventOnDate(e, selected));

        if (filtered.length > 0) {
            setSelectedEvents(filtered);
            setModalVisible(true);
        }
    };


    return (
        <View style={styles.container}>
            <TopHeader title="Calendar" showBackButton />

            <ScrollView>
                <Calendar
                    markedDates={markedDates}
                    onDayPress={onDayPress}
                    theme={{
                        selectedDayBackgroundColor: "#493628",
                        todayTextColor: "#493628",
                        dotColor: "#493628",
                        arrowColor: "#493628",
                    }}
                />

                <View style={styles.todaysContainer}>
                    <Text style={styles.todaysTitle}>Today's Events</Text>

                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <View key={i} style={styles.eventCard}>
                                    <SkeletonBox width="70%" height={18} style={{ marginBottom: 6 }} />
                                    <SkeletonBox width="40%" height={14} />
                                </View>
                            ))}
                        </>
                    ) : todaysEvents.length === 0 ? (
                        <Text style={styles.noEventsText}>No events today</Text>
                    ) : (
                        todaysEvents.map((event, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.eventCard}
                                onPress={() => {
                                    setSelectedEvent(event);
                                    setDetailModalVisible(true);
                                }}
                            >
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                <Text style={styles.eventTime}>
                                    {event.address} — {event.eventStartTime}{event.eventEndTime ? ` - ${event.eventEndTime}` : ""}
                                </Text>

                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Day Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedEvents.length > 0 && selectedEvents[0].startDate ? (
                            <Text style={styles.modalTitle}>
                                Events on {format(parseISO(selectedEvents[0].startDate), "MMMM dd, yyyy")}
                            </Text>
                        ) : (
                            <Text style={styles.modalTitle}>No events found</Text>
                        )}

                        <ScrollView style={{ marginTop: 10 }}>
                            {selectedEvents.map((event, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.eventCard}
                                    onPress={() => {
                                        setSelectedEvent(event);
                                        setDetailModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.eventTime}>
                                        {event.eventStartTime} {event.address ? `— ${event.address}` : ""}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <EventDetailModal
                visible={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                event={selectedEvent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        width: "100%",
        maxHeight: "80%",
    },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: "#493628" },
    eventCard: { backgroundColor: "#F8F4F0", padding: 10, marginBottom: 10, borderRadius: 8 },
    eventTitle: { fontSize: 16, fontWeight: "bold" },
    eventTime: { fontSize: 14, color: "#666", marginVertical: 4 },
    closeButton: {
        marginTop: 10,
        paddingVertical: 10,
        backgroundColor: "#493628",
        borderRadius: 8,
        alignItems: "center",
    },
    closeButtonText: { color: "#fff", fontWeight: "bold" },
    todaysContainer: { padding: 16 },
    todaysTitle: { fontSize: 18, fontWeight: "bold", color: "#493628", marginBottom: 10 },
    noEventsText: { fontSize: 14, color: "#999" },
});

export default CalendarViewScreen;
