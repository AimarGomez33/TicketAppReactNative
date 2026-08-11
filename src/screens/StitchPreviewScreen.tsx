import React from 'react';
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Props {
  image: ImageSourcePropType;
  subtitle: string;
  title: string;
}

export function StitchPreviewScreen({ image, subtitle, title }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.previewContent}>
      <Text style={styles.previewLabel}>
        {title} · {subtitle}
      </Text>
      <View style={styles.previewFrame}>
        <Image
          source={image}
          style={styles.previewImage}
          resizeMode="contain"
          accessibilityLabel={title}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  previewContent: { alignItems: 'center', padding: 16 },
  previewLabel: {
    color: '#BBCABF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewFrame: {
    backgroundColor: '#060E20',
    borderColor: '#3C4A42',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  previewImage: { height: 680, width: '100%' },
});
