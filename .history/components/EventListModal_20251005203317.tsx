import React, { useMemo } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    SafeAreaView,
    ScrollView,
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
        const startDate = item.startDate
            ? format(parseISO(item.startDate), "MMM d, yyyy")
            : "";
        const endDate = item.endDate
            ? format(parseISO(item.endDate), "MMM d, yyyy")
            : "";
        const startTime = item.startTime || "";
        const endTime = item.endTime || "";
        const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate;
        const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={async () => {
                    if (!item.customAddress && item.locationId) {
                        try {
                            const markerDoc = await getDoc(doc(db, "markers", String(item.locationId)));
                            if (markerDoc.exists()) {
                                item.address = markerDoc.data().address || "";
                            } else {
                                item.address = "";
                            }
                        } catch (e) {
                            console.error("Error fetching marker address:", e);
                            item.address = "";
                        }
                    } else {
                        item.address = item.customAddress || "";
                    }
                    onSelect(item);
                }}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.eventName}>{item.name}</Text>
                    {dateRange ? (
                        <Text style={styles.eventDate}>{dateRange}</Text>
                    ) : null}
                    {timeRange ? (
                        <Text style={styles.eventTime}>{timeRange}</Text>
                    ) : null}
                    {item.description ? (
                        <Text style={styles.eventDescription} numberOfLines={3}>
                            {item.description}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={true}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.headerText}>{selectedLocation}</Text>
                    <Text style={styles.subHeader}>Events This Month</Text>

                    {filteredEvents.length > 0 ? (
                        <FlatList
                            data={filteredEvents}
                            keyExtractor={(item, index) => item.id || index.toString()}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                No upcoming events for this location this month.
                            </Text>
                        </View>
                    )}

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
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "90%",
        maxHeight: "80%",
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 15,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2C3E50",
        textAlign: "center",
        marginBottom: 4,
    },
    subHeader: {
        fontSize: 14,
        textAlign: "center",
        color: "#7F8C8D",
        marginBottom: 15,
    },
    card: {
        backgroundColor: "#F8F9FA",
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    cardContent: {
        flexDirection: "column",
    },
    eventName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2C3E50",
    },
    eventDate: {
        fontSize: 14,
        color: "#34495E",
        marginTop: 3,
    },
    eventTime: {
        fontSize: 13,
        color: "#8E44AD",
        marginTop: 2,
        fontWeight: "600",
    },
    eventDescription: {
        fontSize: 13,
        color: "#7F8C8D",
        marginTop: 5,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 50,
    },
    emptyText: {
        color: "#7F8C8D",
        fontSize: 14,
        textAlign: "center",
    },
    closeButton: {
        marginTop: 15,
        backgroundColor: "#2C3E50",
        paddingVertical: 12,
        borderRadius: 10,
    },
    closeButtonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "600",
        fontSize: 16,
    },
});
