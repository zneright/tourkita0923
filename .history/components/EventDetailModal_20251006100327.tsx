import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { format, isToday, parse } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useLandmark } from "../provider/LandmarkProvider";
import { Linking } from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    event: EventType | null;
}


type EventType = {
    id?: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    eventStartTime: string;
    eventEndTime?: string;
    address: string;
    customAddress?: { latitude: number; longitude: number; label: string } | string;
    locationId?: string;
    lat?: number;
    lng?: number;
    imageUrl?: string;
    openToPublic?: boolean;
};


const EventDetailModal: React.FC<Props> = ({ visible, onClose, event }) => {
    const navigation = useNavigation<any>();
    const { setSelectedLandmark, loadDirection } = useLandmark();
    const [loading, setLoading] = useState(false);
    const [isImageModalVisible, setImageModalVisible] = useState(false);
    const [displayAddress, setDisplayAddress] = useState<string>("");
    useEffect(() => {
        const fetchMarkerName = async () => {
            if (!event) return;

            if (event.customAddress) {
                if (typeof event.customAddress === "string") {
                    setDisplayAddress(event.customAddress);
                } else {
                    setDisplayAddress(event.customAddress.label || "N/A");
                }
            } else if (event.locationId) {
                try {
                    const docRef = doc(db, "markers", event.locationId);
                    const snap = await getDoc(docRef);
                    setDisplayAddress(snap.exists() ? snap.data()?.name || "N/A" : "N/A");
                } catch {
                    setDisplayAddress("N/A");
                }
            } else {
                setDisplayAddress(event.address || "N/A");
            }
        };

        fetchMarkerName();
    }, [event]);

    if (!event) {
        return null;
    }

    const start = parse(event.startDate, "yyyy-MM-dd", new Date());
    const end = event.endDate ? parse(event.endDate, "yyyy-MM-dd", start) : start;



    let displayDate = "";
    if (isToday(start) && !event.endDate) {
        displayDate = "Today";
    } else if (start.getTime() === end.getTime()) {
        displayDate = format(start, "MMMM dd, yyyy");
    } else {
        displayDate = `${format(start, "MMMM dd, yyyy")} — ${format(end, "MMMM dd, yyyy")}`;
    }

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return "N/A";
        try {
            const t = parse(timeStr, "HH:mm", new Date());
            return format(t, "hh:mm a");
        } catch {
            return timeStr;
        }
    };

    const formattedStartTime = formatTime(event.eventStartTime);
    const formattedEndTime = event.eventEndTime ? formatTime(event.eventEndTime) : null;

    const publicStatus = event.openToPublic ? "Open to Public" : "Not Open to Public";
    const publicStatusColor = event.openToPublic ? "#27ae60" : "#c0392b";

    const handleNavigate = async () => {
        try {
            setLoading(true);

            const target = {
                name: event.title,
                category: "Events",
            };

            if (event.lat && event.lng) {
                target.latitude = event.lat;
                target.longitude = event.lng;
                loadDirection(target);
                navigation.navigate("Maps", target);

            } else if (event.locationId) {
                const docRef = doc(db, "markers", event.locationId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const marker = snap.data();
                    setSelectedLandmark(marker);
                    navigation.navigate("Maps", {
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                        name: event.title,
                        category: "Events",
                    });
                } else {
                    navigation.navigate("Maps", { category: "Events" });
                }
            } else {
                navigation.navigate("Maps", { category: "Events" });
            }

            onClose();
        } catch (err) {
            console.error("Navigation failed:", err);
        } finally {
            setLoading(false);
        }
    };



    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                        <Ionicons name="close" size={28} color="#555" />
                    </TouchableOpacity>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Hero Image */}
                        {event.imageUrl && (
                            <View style={{ width: "100%" }}>
                                <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                                    <Image
                                        source={{ uri: event.imageUrl }}
                                        style={styles.heroImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.title}>{event.title}</Text>

                        <View style={[styles.cardBase, styles.infoCard]}>
                            <Ionicons name="calendar-outline" size={20} color="#555" />
                            <Text style={styles.infoText}>{displayDate}</Text>
                        </View>

                        <View style={[styles.cardBase, styles.infoCard]}>
                            <Ionicons name="time-outline" size={20} color="#555" />
                            <Text style={styles.infoText}>
                                {formattedStartTime}
                                {formattedEndTime ? ` — ${formattedEndTime}` : ""}
                            </Text>
                        </View>

                        <View style={[styles.cardBase, styles.infoCard]}>
                            <Ionicons name="location-outline" size={20} color="#555" />
                            <Text style={styles.infoText} numberOfLines={2}>
                                {displayAddress}
                            </Text>


                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            {event.description ? (
                                <Text style={styles.description}>
                                    {event.description.split(/(\s+)/).map((part, index) => {
                                        const urlPattern = /https?:\/\/[^\s]+/;
                                        if (urlPattern.test(part)) {
                                            return (
                                                <Text
                                                    key={index}
                                                    style={{ color: "#3498db", textDecorationLine: "underline" }}
                                                    onPress={() => Linking.openURL(part)}
                                                >
                                                    {part}
                                                </Text>
                                            );
                                        } else {
                                            return part;
                                        }
                                    })}
                                </Text>
                            ) : (
                                <Text style={styles.description}>No description provided.</Text>
                            )}
                        </View>



                        <View style={styles.statusCard}>
                            <Ionicons name="people-outline" size={20} color={publicStatusColor} />
                            <Text style={[styles.statusText, { color: publicStatusColor }]}>
                                {publicStatus}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.navigateButton}
                            onPress={handleNavigate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.navigateText}>Navigate</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                    {event.imageUrl && (
                        <Modal visible={isImageModalVisible} transparent animationType="fade">
                            <TouchableOpacity
                                style={styles.modal}
                                onPress={() => setImageModalVisible(false)}
                                activeOpacity={1}
                            >
                                <Image
                                    source={{ uri: event.imageUrl }}
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        </Modal>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 10 },
    modalContainer: { width: "95%", maxHeight: "85%", backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" },
    closeIcon: { position: "absolute", top: 10, right: 10, zIndex: 10 },
    content: { paddingTop: 40, paddingHorizontal: 20, alignItems: "center", paddingBottom: 20 },
    heroImage: { width: "100%", height: 220, borderRadius: 16, marginBottom: 15, backgroundColor: "#ddd" },
    title: { fontSize: 24, fontWeight: "bold", color: "#2c3e50", textAlign: "center", marginBottom: 15 },
    cardBase: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", padding: 12, borderRadius: 12, width: "100%", marginBottom: 12 },
    infoCard: { justifyContent: "flex-start" },
    infoText: { fontSize: 12, color: "#555", marginLeft: 8 },
    section: { width: "100%", marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
    description: { fontSize: 15, color: "#555", textAlign: "justify", lineHeight: 20 },
    statusCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0", padding: 12, borderRadius: 12, marginBottom: 20 },
    statusText: { fontSize: 13, fontWeight: "bold", marginLeft: 8 },
    navigateButton: { backgroundColor: "#493628", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: "100%", alignItems: "center" },
    navigateText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    modal: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
    modalImage: { width: "90%", height: "70%", borderRadius: 12, borderWidth: 2, borderColor: "#D7CCC8" },
});

export default EventDetailModal;