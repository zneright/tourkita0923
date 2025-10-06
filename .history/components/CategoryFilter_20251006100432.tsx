import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";

type Props = {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
};

export default function CategoryFilter({ selectedCategory, onSelectCategory }: Props) {
    const categories = [

        { label: "All", uri: "https://img.icons8.com/ios-filled/100/9c8061/globe.png" },

        { label: "Events", uri: "https://img.icons8.com/ios-filled/100/9c8061/calendar.png" },
        { label: "Historical", uri: "https://img.icons8.com/ios-filled/100/9c8061/monument.png" },
        { label: "Food", uri: "https://img.icons8.com/ios-filled/100/9c8061/restaurant.png" },
        { label: "Museum", uri: "https://img.icons8.com/ios-filled/100/9c8061/museum.png" },
        { label: "Park", uri: "https://img.icons8.com/ios-filled/100/9c8061/deciduous-tree.png" },
        { label: "School", uri: "https://img.icons8.com/ios-filled/100/9c8061/school.png" },
        { label: "Restroom", uri: "https://img.icons8.com/ios-filled/100/9c8061/toilet.png" },
        { label: "Government", uri: "https://img.icons8.com/ios-filled/100/9c8061/city-hall.png" },

    ];

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {categories.map((cat, index) => {
                    const isSelected = selectedCategory === cat.label;
                    const iconUri = cat.uri.replace(
                        "9c8061",
                        isSelected ? "D6C0B3" : "9c8061"
                    );

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.category}
                            onPress={() => onSelectCategory(cat.label)}
                        >
                            <Image source={{ uri: iconUri }} style={styles.icon} />
                            <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#493628",
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    scrollContainer: {
        flexDirection: "row",
        paddingRight: 12,
    },
    category: {
        alignItems: "center",
        marginRight: 16,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 6,
    },
    label: {
        color: "#9c8061",
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    selectedLabel: {
        color: "#D6C0B3",
    },
});
