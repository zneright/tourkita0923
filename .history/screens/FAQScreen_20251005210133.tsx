import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    BackHandler
} from "react-native";
import { db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../Navigation/types";

interface FAQItem {
    question: string;
    answer: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "FAQScreen">;

const FAQScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.goBack();
            return true;
        });
        return () => backHandler.remove();
    }, [navigation]);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const docRef = doc(db, "faq", "latest");
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setFaqs(data.items || []);
                } else {
                    console.warn("FAQ document does not exist!");
                    setFaqs([]);
                }
            } catch (err) {
                console.error("Failed to fetch FAQs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFAQs();
    }, []);

    const toggleFAQ = (index: number) => {
        setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>FAQs</Text>
                </View>
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#8B5E3C" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Frequently Ask Questions</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {faqs.length === 0 ? (
                    <Text style={styles.noFAQ}>No FAQs available.</Text>
                ) : (
                    faqs.map((faq, index) => (
                        <View key={index} style={styles.faqItem}>
                            <TouchableOpacity
                                onPress={() => toggleFAQ(index)}
                                style={styles.questionButton}
                            >
                                <Text style={styles.questionText}>{faq.question}</Text>
                                <Text style={styles.arrow}>{expandedIndex === index ? "▲" : "▼"}</Text>
                            </TouchableOpacity>
                            {expandedIndex === index && (
                                <Text style={styles.answerText}>{faq.answer}</Text>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFA" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    backButton: { marginRight: 12 },
    headerText: { fontSize: 20, fontWeight: "600", color: "#333" },
    content: { padding: 20 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    noFAQ: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#555" },
    faqItem: { marginBottom: 16, backgroundColor: "#fff", borderRadius: 12, padding: 12, elevation: 2 },
    questionButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    questionText: { fontSize: 16, fontWeight: "600", color: "#493628" },
    arrow: { fontSize: 16, color: "#8B5E3C" },
    answerText: { marginTop: 8, fontSize: 14, color: "#6B5E5E" },
});

export default FAQScreen;
