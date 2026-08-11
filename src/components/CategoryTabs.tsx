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
    backgroundColor: '#0B1326',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4A42',
  },
  scrollContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#171F33',
    borderWidth: 1,
    borderColor: '#3C4A42',
  },
  activeTab: {
    backgroundColor: '#10B981',
    borderColor: '#4EDEA3',
  },
  tabText: {
    color: '#BBCABF',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#003824',
    fontWeight: 'bold',
  },
});
