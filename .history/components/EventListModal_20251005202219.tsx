import React from "react";
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { format, parseISO } from "date-fns";

type Event = {
    id: string;
    title: string;
    description?: string;
    address?: string;
    eventStartTime?: string;
    eventEndTime?: string;
    startDate?: string;
    endDate?: string;
    imageUrl?: string;
};

type EventListModalProps = {
    visible: boolean;
    onClose: () => void;
    events: Event[];
    clickedDate?: string | null;
    onSelectEvent: (event: Event) => void;
};

const EventListModal: React.FC<EventListModalProps> = ({
    visible,
    onClose,
    events,
    clickedDate,
    onSelectEvent,
}) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.modalTitle}>
                            {events.length > 0
                                ? `Events on ${clickedDate
                                    ? format(parseISO(clickedDate), "MMMM dd, yyyy")
                                    : "Selected Date"}`
                                : "No Events Found"}
                        </Text>
                        <View
                            style={{
                                height: 2,
                                backgroundColor: "#493628",
                                marginTop: 4,
                                borderRadius: 1,
                            }}
                        />
                    </View>

                    {/* Event List */}
                    <ScrollView>
                        {events.length > 0 ? (
                            events.map((event, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.eventCard}
                                    onPress={() => onSelectEvent(event)}
                                >
                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                    <Text style={styles.eventTime}>
                                        {event.address
                                            ? `${event.address} `
                                            : ""}
                                        {event.eventStartTime
                                            ? `— ${event.eventStartTime}${event.eventEndTime
                                                ? ` - ${event.eventEndTime}`
                                                : ""
                                            }`
                                            : ""}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noEventsText}>
                                No events for this date.
                            </Text>
                        )}
                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

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
    },
    eventCard: {
        backgroundColor: "#F8F4F0",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#493628",
        marginBottom: 4,
    },
    eventTime: {
        fontSize: 14,
        color: "#666",
    },
    noEventsText: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        marginTop: 10,
    },
    closeButton: {
        marginTop: 12,
        paddingVertical: 10,
        backgroundColor: "#493628",
        borderRadius: 8,
        alignItems: "center",
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default EventListModal;
