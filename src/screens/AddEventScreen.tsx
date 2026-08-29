import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, DAY_TYPE_OPTIONS } from '../constants';
import { createEvent } from '../services/api';
import { formatLocalDateKey } from '../utils';
import {
  DateTimePicker,
  Icon,
  ScreenLayout,
  FormField,
  PrimaryButton,
} from '../components';
import { screenStyles } from '../theme/screenStyles';

type AddEventScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEvent'>;

interface Props {
  navigation: AddEventScreenNavigationProp;
}

const AddEventScreen: React.FC<Props> = ({ navigation }) => {
  const [passcode, setPasscode] = useState('');
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const handlePasscodeSubmit = () => {
    setPasscodeError(null);
    if (passcode === '4321') {
      setIsPasscodeVerified(true);
    } else {
      setPasscodeError('Incorrect passcode. Please try again.');
      setPasscode('');
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!category) {
      setError('Please select an event category');
      return;
    }

    if (!title.trim()) {
      setError('Please enter an occasion name');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      setError('End date must be on or after start date');
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        title: title.trim(),
        category,
        ...(startDate ? { fromDate: startDate } : {}),
        ...(endDate ? { toDate: endDate } : {}),
      });
      Alert.alert('Success', 'Occasion added successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add occasion';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isPasscodeVerified) {
    return (
      <ScreenLayout keyboard centered>
        <View style={[screenStyles.card, styles.card]}>
          <Text style={screenStyles.screenTitle}>Verify Passcode</Text>
          <Text style={screenStyles.screenSubtitle}>
            Enter the passcode to create a new occasion.
          </Text>

          <FormField
            label="Passcode"
            icon="key-outline"
            placeholder="Enter passcode"
            value={passcode}
            onChangeText={setPasscode}
            secureTextEntry
            keyboardType="number-pad"
          />

          {passcodeError ? (
            <View style={screenStyles.errorBanner}>
              <Icon name="alert-circle-outline" size={18} color={COLORS.danger} family="ionicons" />
              <Text style={[screenStyles.bannerText, screenStyles.errorText]}>{passcodeError}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <View style={styles.flexBtn}>
              <PrimaryButton title="Verify" icon="shield-checkmark-outline" onPress={handlePasscodeSubmit} />
            </View>
            <PrimaryButton title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelBtn} />
          </View>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout keyboard centered>
      <View style={[screenStyles.card, styles.card]}>
        <Text style={screenStyles.screenTitle}>Add Occasion</Text>
        <Text style={screenStyles.screenSubtitle}>
          Create a new occasion to use when checking in volunteers.
        </Text>

        <Text style={screenStyles.label}>Event Category</Text>
        <View style={[screenStyles.optionsContainer, styles.categoryOptions]}>
          {DAY_TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                screenStyles.optionButton,
                category === opt.value && screenStyles.optionButtonSelected,
              ]}
              onPress={() => setCategory(opt.value)}
            >
              <Text
                style={[
                  screenStyles.optionButtonText,
                  category === opt.value && screenStyles.optionButtonTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FormField
          label="Occasion title"
          icon="calendar-outline"
          placeholder="Occasion name"
          value={title}
          onChangeText={setTitle}
        />

        <TouchableOpacity
          style={styles.dateRangeToggle}
          onPress={() => setShowDateRange(prev => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.dateRangeToggleIcon}>{showDateRange ? '▼' : '▶'}</Text>
          <Text style={styles.dateRangeToggleText}>Add Date Range (Optional)</Text>
        </TouchableOpacity>

        {showDateRange ? (
          <View style={styles.dateRangeSection}>
            <View style={styles.dateRangeRow}>
              <TouchableOpacity
                style={[styles.dateBtn, styles.dateBtnHalf]}
                onPress={() => setShowStartDatePicker(true)}
                activeOpacity={0.8}
              >
                <Icon name="calendar-outline" size={18} color={COLORS.gray} family="ionicons" />
                <Text style={startDate ? styles.dateText : styles.datePlaceholder}>
                  {startDate || 'Start Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateBtn, styles.dateBtnHalf]}
                onPress={() => setShowEndDatePicker(true)}
                activeOpacity={0.8}
              >
                <Icon name="calendar-outline" size={18} color={COLORS.gray} family="ionicons" />
                <Text style={endDate ? styles.dateText : styles.datePlaceholder}>
                  {endDate || 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <DateTimePicker
          visible={showStartDatePicker}
          onClose={() => setShowStartDatePicker(false)}
          onSelectDateTime={(date) => setStartDate(formatLocalDateKey(date))}
          dateOnly
        />
        <DateTimePicker
          visible={showEndDatePicker}
          onClose={() => setShowEndDatePicker(false)}
          onSelectDateTime={(date) => setEndDate(formatLocalDateKey(date))}
          dateOnly
        />

        {error ? (
          <View style={screenStyles.errorBanner}>
            <Icon name="alert-circle-outline" size={18} color={COLORS.danger} family="ionicons" />
            <Text style={[screenStyles.bannerText, screenStyles.errorText]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <View style={styles.flexBtn}>
            <PrimaryButton
              title="Add Occasion"
              icon="add-circle-outline"
              onPress={handleSubmit}
              loading={loading}
            />
          </View>
          <PrimaryButton title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelBtn} />
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  categoryOptions: {
    marginBottom: 16,
  },
  dateRangeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 4,
  },
  dateRangeToggleIcon: {
    fontSize: 12,
    color: COLORS.textPrimary,
    width: 14,
  },
  dateRangeToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateRangeSection: {
    marginBottom: 16,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f8fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 90, 121, 0.1)',
  },
  dateBtnHalf: {
    flex: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
  cancelBtn: {
    minWidth: 100,
  },
});

export default AddEventScreen;
