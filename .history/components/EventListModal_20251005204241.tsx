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
        let dateRange = startDate;

        if (endDateISO && format(endDateISO, "yyyy-MM-dd") !== format(startDateISO, "yyyy-MM-dd")) {
            const endDate = format(endDateISO, "MMM d, yyyy");
            dateRange = `${startDate} - ${endDate}`;
        }

        const startTime = item.eventStartTime || "";
        const endTime = item.eventEndTime || "";
        const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

        return (
            <TouchableOpacity
                style={styles.eventCard}
                onPress={() => {
                    item.address = item.customAddress || "";
                    onSelect(item);
                }}
            >
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>
                    {dateRange} {timeRange ? `— ${timeRange}` : ""}
                </Text>
                {item.description ? (
                    <Text style={styles.eventDescription} numberOfLines={3}>
                        {item.description}
                    </Text>
                ) : null}
            </TouchableOpacity>
        );
    };


    return (
        <Modal animationType="slide" transparent visible onRequestClose={onClose}>
            <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{selectedLocation}</Text>
                    <FlatList
                        data={filteredEvents}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <Text style={styles.noEventsText}>
                                No upcoming events for this location this month.
                            </Text>
                        }
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default EventListModal;

const styles = StyleSheet.create({
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
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#493628",
        marginBottom: 10,
        textAlign: "center",
    },
    eventCard: {
        backgroundColor: "#F8F4F0",
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#493628",
    },
    eventTime: {
        fontSize: 14,
        color: "#666",
        marginVertical: 4,
    },
    eventDescription: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
        lineHeight: 18,
    },
    closeButton: {
        marginTop: 10,
        paddingVertical: 10,
        backgroundColor: "#493628",
        borderRadius: 8,
        alignItems: "center",
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    noEventsText: {
        textAlign: "center",
        color: "#999",
        marginVertical: 20,
    },
});
