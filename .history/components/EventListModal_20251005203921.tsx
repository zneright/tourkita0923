import React, { useMemo } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { format, parseISO, isWithinInterval, startOfToday, endOfMonth } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

interface EventListModalProps {
    events: any[];
    selectedLocation: string;
    onClose: () => void;
    onSelect: (event: any) => void;
}

const EventListModal: React.FC<EventListModalProps> = ({
    events,
    selectedLocation,
    onClose,
    onSelect,
}) => {
    // Filter events for current month
    const filteredEvents = useMemo(() => {
        const today = startOfToday();
        const endMonth = endOfMonth(today);

        return events.filter((item) => {
            if (!item.startDate) return false;
            const start = parseISO(item.startDate);
            return isWithinInterval(start, { start: today, end: endMonth });
        });
    }, [events]);
    const renderItem = ({ item }: { item: any }) => {
        const startDateISO = parseISO(item.startDate);
        const endDateISO = item.endDate ? parseISO(item.endDate) : null;

        const startDate = format(startDateISO, "MMM d, yyyy");
        const endDate = endDateISO ? format(endDateISO, "MMM d, yyyy") : "";

        const dateRange = endDate ? `${startDate} - ${endDate}` : startDate;

        // Use eventStartTime and eventEndTime from your data
        const startTime = item.eventStartTime || "";
        const endTime = item.eventEndTime || "";
        const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

        return (
            <TouchableOpacity
                style={styles.eventCard}
                onPress={async () => {
                    // Use customAddress if available
                    item.address = item.customAddress || "";
                    onSelect(item);
                }}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.eventName}>{item.title}</Text>
                    {dateRange ? <Text style={styles.eventDate}>{dateRange}</Text> : null}
                    {timeRange ? <Text style={styles.eventTime}>{timeRange}</Text> : null}
                    {item.description ? (
                        <Text style={styles.eventDescription} numberOfLines={3}>
                            {item.description}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };


    export default EventListModal;

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
        },
        modalBox: {
            width: "90%",
            maxHeight: "80%",
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingVertical: 25,
            paddingHorizontal: 20,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 8,
        },
        locationText: {
            fontSize: 20,
            fontWeight: "700",
            color: "#1E2F4D", // TourKita navy
            textAlign: "center",
            marginBottom: 4,
        },
        sectionTitle: {
            fontSize: 14,
            textAlign: "center",
            color: "#C9A227", // TourKita gold accent
            marginBottom: 18,
            fontWeight: "600",
        },
        eventCard: {
            backgroundColor: "#F8F9FC",
            borderRadius: 16,
            padding: 15,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 2,
        },
        cardContent: {
            flexDirection: "column",
        },
        eventName: {
            fontSize: 16,
            fontWeight: "700",
            color: "#1E2F4D",
            marginBottom: 2,
        },
        eventDate: {
            fontSize: 13,
            color: "#34495E",
            marginTop: 2,
        },
        eventTime: {
            fontSize: 13,
            color: "#C9A227",
            fontWeight: "600",
            marginTop: 2,
        },
        eventDescription: {
            fontSize: 13,
            color: "#6B7280",
            marginTop: 6,
            lineHeight: 18,
        },
        emptyContainer: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 50,
        },
        emptyText: {
            color: "#6B7280",
            fontSize: 14,
            textAlign: "center",
        },
        closeButton: {
            marginTop: 15,
            backgroundColor: "#1E2F4D",
            paddingVertical: 12,
            borderRadius: 12,
        },
        closeButtonText: {
            color: "#FFFFFF",
            textAlign: "center",
            fontWeight: "600",
            fontSize: 15,
            letterSpacing: 0.3,
        },
    });
