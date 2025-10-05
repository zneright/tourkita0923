import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { format, parseISO } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
interface EventListModalProps {
    events: any[];
    onClose: () => void;
    onSelect: (event: any) => void;
}

const EventListModal: React.FC<EventListModalProps> = ({
    events,
    onClose,
    onSelect,
}) => {
    const renderItem = ({ item }: { item: any }) => {
        const startDate = item.startDate ? format(parseISO(item.startDate), "MMM d, yyyy") : "";
        const endDate = item.endDate ? format(parseISO(item.endDate), "MMM d, yyyy") : "";
        const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate;

        return (
            <TouchableOpacity
                style={styles.eventItem}
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
                <Text style={styles.eventName}>{item.name}</Text>
                {item.startDate && item.endDate ? (
                    <Text style={styles.eventDate}>
                        {format(parseISO(item.startDate), "MMM d")} - {format(parseISO(item.endDate), "MMM d")}
                    </Text>
                ) : null}
                {item.description ? (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
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
                    <Text style={styles.title}>Select an Event</Text>
                    <FlatList
                        data={events}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
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
        maxHeight: "70%",
        backgroundColor: "#fff",
        borderRadius: 15,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    eventItem: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    eventName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    eventDate: {
        fontSize: 14,
        color: "#555",
        marginVertical: 2,
    },
    eventDescription: {
        fontSize: 13,
        color: "#666",
    },
    closeButton: {
        marginTop: 10,
        backgroundColor: "#333",
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
