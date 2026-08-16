// src/components/CategoryTabs.tsx
import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { CATEGORIES, Category } from '../data/mockupMenu';

interface Props {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryTabs: React.FC<Props> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {CATEGORIES.map((cat: Category) => {
          const isActive = cat.id === selectedCategoryId;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff8f8',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe0ea',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff', // surface-container-lowest
    borderWidth: 1,
    borderColor: '#ffe0ea',
  },
  activeTab: {
    backgroundColor: '#ffd9e5', // primary-container (pink light)
    borderColor: 'transparent',
  },
  tabText: {
    color: '#27171d', // on-surface
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#b3006c', // primary
    fontWeight: '700',
  },
});
