import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PrimaryButton, ScreenHeader, ScreenLayout } from '../components';
import {
  fetchServiceRequisition,
  saveServiceRequisition,
  updateServiceRequisition,
} from '../services/api';
import {
  RootStackParamList,
  ServiceRequisition,
  ServiceRequisitionInput,
  ServiceRequisitionStatus,
} from '../types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'ServiceRequisition'>;
type ScreenRoute = RouteProp<RootStackParamList, 'ServiceRequisition'>;

interface Props {
  navigation: Navigation;
  route: ScreenRoute;
}

type Fields = {
  requestDate: string;
  programTitle: string;
  organisingInstitution: string;
  collaboratingInstitutes: string;
  invitedGuest: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  targetAudience: string;
  ageGroup: string;
  expectedGathering: string;
  objectives: string;
  otherVenue: string;
  chairsRequired: string;
  otherRequirements: string;
  tkService: string;
  requestorName: string;
  contactDetails: string;
  mukhiSaheb: string;
  kamadiaSaheb: string;
  directorGent: string;
  directorLadies: string;
  rec: string;
  studyCircle: string;
};

const DRAFT_KEY = 'service_requisition_draft_id';

const venueOptions = [
  'Conference Room',
  'Meeting Room',
  'Mini JK Hall',
  'JK Outside Compound',
  'REC venue request email has been sent',
];

const requirementOptions = ['MIC', 'Multimedia', 'Speakers', 'TKN Utilization', 'Laptop', 'Photographer'];

const serviceGroups = [
  {
    title: 'PHMU Service',
    items: [
      'Paat Service',
      'Nanad Service',
      'Turn Service',
      'Audio Video Service',
      'Flower Service',
      'Facilitation Service',
      'Jura/Tabarruk Service',
      'Announce/Notice Brd.',
      'Nikah Service',
    ],
  },
  {
    title: 'SSU Service',
    items: ['PASC', 'CERT', 'Facilitation Service', 'Elevator Service', 'Wheelchair Service', 'Boy Scout', 'Girls Guide'],
  },
  {
    title: 'SAU Service',
    items: [
      'Decoration Service',
      'Kitchen Service',
      'Funeral Service',
      'Landscaping Service',
      'Transport Service',
      'Shoe Service',
      'Water Service',
      'House Keeping Service',
      'Maintenance Service',
      'Child Care Service',
      'Canteen Service',
      'Pipe Band',
      'Flute Band',
      'Orchestra',
      'Event Mang. Service',
    ],
  },
  { title: 'REC', items: ['Teachers', 'Students'] },
];

const initialFields: Fields = {
  requestDate: '',
  programTitle: '',
  organisingInstitution: '',
  collaboratingInstitutes: '',
  invitedGuest: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  duration: '',
  targetAudience: '',
  ageGroup: '',
  expectedGathering: '',
  objectives: '',
  otherVenue: '',
  chairsRequired: '',
  otherRequirements: '',
  tkService: '',
  requestorName: '',
  contactDetails: '',
  mukhiSaheb: '',
  kamadiaSaheb: '',
  directorGent: '',
  directorLadies: '',
  rec: '',
  studyCircle: '',
};

const emptyServiceState = (): Record<string, string> =>
  Object.fromEntries(serviceGroups.flatMap(group => group.items.map(item => [`${group.title}:${item}`, ''])));

const coerceRecord = (value: unknown): Record<string, string | number> | null => {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, string | number>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string | number>;
  }
  return null;
};

const normalizeServiceVolunteers = (raw: unknown): Record<string, string> => {
  const normalized = emptyServiceState();
  const record = coerceRecord(raw);
  if (!record) return normalized;

  Object.entries(record).forEach(([key, value]) => {
    normalized[key] = value == null ? '' : String(value);
  });
  return normalized;
};

const normalizeStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
};

const toggleValue = (value: string, selected: string[]) =>
  selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];

const nullable = (value: string) => value.trim() || null;

const applyRequisitionData = (
  data: ServiceRequisition,
  setters: {
    setRequisitionId: (id: string) => void;
    setCurrentStatus: (status: ServiceRequisitionStatus) => void;
    setFields: React.Dispatch<React.SetStateAction<Fields>>;
    setVenues: (venues: string[]) => void;
    setRequirements: (requirements: string[]) => void;
    setServicesRequired: (value: boolean) => void;
    setServiceVolunteers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setPrfAttachment: (value: string | null) => void;
  }
) => {
  setters.setRequisitionId(data.id);
  setters.setCurrentStatus(data.status);
  setters.setFields({
    requestDate: data.requestDate || '',
    programTitle: data.programTitle || '',
    organisingInstitution: data.organisingInstitution || '',
    collaboratingInstitutes: data.collaboratingInstitutes || '',
    invitedGuest: data.invitedGuest || '',
    eventDate: data.eventDate || '',
    startTime: data.startTime || '',
    endTime: data.endTime || '',
    duration: data.duration || '',
    targetAudience: data.targetAudience || '',
    ageGroup: data.ageGroup || '',
    expectedGathering: data.expectedGathering != null ? String(data.expectedGathering) : '',
    objectives: data.objectives || '',
    otherVenue: data.otherVenue || '',
    chairsRequired: data.chairsRequired != null ? String(data.chairsRequired) : '',
    otherRequirements: data.otherRequirements || '',
    tkService: data.tkService || '',
    requestorName: data.requestorName || '',
    contactDetails: data.contactDetails || '',
    mukhiSaheb: data.mukhiSaheb || '',
    kamadiaSaheb: data.kamadiaSaheb || '',
    directorGent: data.directorGent || '',
    directorLadies: data.directorLadies || '',
    rec: data.rec || '',
    studyCircle: data.studyCircle || '',
  });
  setters.setVenues(normalizeStringList(data.venues));
  setters.setRequirements(normalizeStringList(data.requirements));
  setters.setServicesRequired(data.servicesRequired !== false);
  setters.setServiceVolunteers(normalizeServiceVolunteers(data.serviceVolunteers));
  setters.setPrfAttachment(data.prfAttachment || null);
};

const statusLabel: Record<ServiceRequisitionStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
};

const ServiceRequisitionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [fields, setFields] = useState<Fields>(initialFields);
  const [venues, setVenues] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [servicesRequired, setServicesRequired] = useState(true);
  const [serviceVolunteers, setServiceVolunteers] = useState<Record<string, string>>(() => emptyServiceState());
  const [requisitionId, setRequisitionId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ServiceRequisitionStatus | null>(null);
  const [prfAttachment, setPrfAttachment] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saving, setSaving] = useState<ServiceRequisitionStatus | null>(null);

  const isEditing = !!requisitionId && currentStatus !== 'DRAFT';
  const isReadOnly = currentStatus === 'APPROVED';
  const safeVenues = Array.isArray(venues) ? venues : [];
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const safeServiceVolunteers =
    serviceVolunteers && typeof serviceVolunteers === 'object' ? serviceVolunteers : emptyServiceState();

  const selectedServiceCount = useMemo(
    () => Object.values(safeServiceVolunteers).filter(value => String(value || '').trim()).length,
    [safeServiceVolunteers]
  );

  useEffect(() => {
    let cancelled = false;

    const loadRequisition = async () => {
      const editId = route.params?.id;
      const passedRequisition = route.params?.requisition;

      try {
        if (passedRequisition && (!editId || passedRequisition.id === editId)) {
          applyRequisitionData(passedRequisition, {
            setRequisitionId,
            setCurrentStatus,
            setFields,
            setVenues,
            setRequirements,
            setServicesRequired,
            setServiceVolunteers,
            setPrfAttachment,
          });
          return;
        }

        const savedId = editId || (await AsyncStorage.getItem(DRAFT_KEY));
        if (!savedId) return;

        const data = await fetchServiceRequisition(savedId);
        if (cancelled) return;

        applyRequisitionData(data, {
          setRequisitionId,
          setCurrentStatus,
          setFields,
          setVenues,
          setRequirements,
          setServicesRequired,
          setServiceVolunteers,
          setPrfAttachment,
        });
      } catch {
        Alert.alert(
          'Load failed',
          editId
            ? 'Failed to load service requisition for editing.'
            : 'Failed to load saved service requisition draft.'
        );
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    };

    loadRequisition();
    return () => {
      cancelled = true;
    };
  }, [route.params?.id, route.params?.requisition]);

  const updateField = (name: keyof Fields, value: string) => {
    setFields(prev => ({ ...prev, [name]: value }));
  };

  const save = async (status: ServiceRequisitionStatus) => {
    if (isReadOnly) return;

    if (!fields.programTitle.trim()) {
      Alert.alert('Program/Event Title', 'Please enter the program/event title.');
      return;
    }

    setSaving(status);
    try {
      const payload: ServiceRequisitionInput = {
        ...fields,
        requestDate: nullable(fields.requestDate),
        programTitle: fields.programTitle.trim(),
        organisingInstitution: nullable(fields.organisingInstitution),
        collaboratingInstitutes: nullable(fields.collaboratingInstitutes),
        invitedGuest: nullable(fields.invitedGuest),
        eventDate: nullable(fields.eventDate),
        chairsRequired: fields.chairsRequired,
        venues: safeVenues,
        requirements: safeRequirements,
        servicesRequired,
        serviceVolunteers: safeServiceVolunteers,
        status,
      };

      const shouldPost =
        !requisitionId || (currentStatus === 'DRAFT' && status === 'SUBMITTED');

      const data = shouldPost
        ? await saveServiceRequisition(
            requisitionId ? { ...payload, id: requisitionId } : payload
          )
        : await updateServiceRequisition(requisitionId!, payload);

      setRequisitionId(data.id);
      setCurrentStatus(data.status);
      await AsyncStorage.setItem(DRAFT_KEY, data.id);

      const warnings = shouldPost
        ? [
            'emailSkipped' in data && data.emailSkipped
              ? 'Email was skipped because SMTP is not configured.'
              : '',
            'emailError' in data ? data.emailError || '' : '',
          ].filter(Boolean)
        : [];

      const successTitle = isEditing
        ? 'Service requisition updated'
        : status === 'SUBMITTED'
          ? 'Service requisition submitted'
          : 'Draft saved';

      const successMessage = warnings.length
        ? warnings.join('\n')
        : 'Your service requisition has been saved.';

      const didUpdate = !!requisitionId && !shouldPost;

      Alert.alert(
        successTitle,
        successMessage,
        didUpdate ? [{ text: 'OK', onPress: () => navigation.goBack() }] : undefined
      );
    } catch (error) {
      Alert.alert(
        isEditing ? 'Update failed' : 'Save failed',
        error instanceof Error ? error.message : 'Failed to save service requisition.'
      );
    } finally {
      setSaving(null);
    }
  };

  const handleBack = () => {
    if (saving) return;
    navigation.goBack();
  };

  if (loadingDraft) {
    return <ScreenLayout loading loadingText="Loading form..." />;
  }

  return (
    <ScreenLayout contentContainerStyle={styles.scrollContent}>
      <ScreenHeader
        title={isEditing ? 'Edit Service Requisition' : 'Service Requisition'}
        subtitle={
          currentStatus
            ? `Status: ${statusLabel[currentStatus]}${isReadOnly ? ' (read only)' : ''}`
            : 'Fill in the form below'
        }
        onBack={handleBack}
      />

      <View style={styles.a4Page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.orgKicker}>Ismaili Volunteer and Facilitation Management Service</Text>
          <Text style={styles.orgTitle}>Noorabad Jamatkhana</Text>
          <Text style={styles.formTitle}>Service Requisition Form</Text>
          <Text style={styles.formInstruction}>
            Please fill in all required fields. Use N/A where not applicable.
          </Text>
        </View>

        {/* Program Details — two column */}
        <SectionHeader title="Program Details" />
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <DocField label="Service Request Date" value={fields.requestDate} placeholder="YYYY-MM-DD" onChange={v => updateField('requestDate', v)} />
            <DocField label="Program/Event Title" value={fields.programTitle} placeholder="Required" onChange={v => updateField('programTitle', v)} />
            <DocField label="Organizing Institution" value={fields.organisingInstitution} onChange={v => updateField('organisingInstitution', v)} />
            <DocField label="Collaborating Institute(s)" value={fields.collaboratingInstitutes} onChange={v => updateField('collaboratingInstitutes', v)} />
            <DocField label="Invited Guest" value={fields.invitedGuest} onChange={v => updateField('invitedGuest', v)} />
          </View>
          <View style={styles.col}>
            <DocField label="Day(s) & Date(s)" value={fields.eventDate} placeholder="YYYY-MM-DD" onChange={v => updateField('eventDate', v)} />
            <View style={styles.row}>
              <DocField label="Start Time" value={fields.startTime} onChange={v => updateField('startTime', v)} style={styles.halfInput} />
              <DocField label="End Time" value={fields.endTime} onChange={v => updateField('endTime', v)} style={styles.halfInput} />
            </View>
            <DocField label="Duration" value={fields.duration} onChange={v => updateField('duration', v)} />
            <DocField label="Target Audience" value={fields.targetAudience} onChange={v => updateField('targetAudience', v)} />
            <DocField label="Age Group" value={fields.ageGroup} onChange={v => updateField('ageGroup', v)} />
            <DocField label="Expected Gathering" value={fields.expectedGathering} keyboardType="number-pad" onChange={v => updateField('expectedGathering', v)} />
          </View>
        </View>

        {/* Objectives */}
        <SectionHeader title="Objectives and Brief Details of the Programme" />
        <View style={styles.borderedBox}>
          <TextInput
            style={styles.docTextArea}
            placeholderTextColor="#999"
            multiline
            value={fields.objectives}
            onChangeText={v => updateField('objectives', v)}
          />
        </View>

        {/* PRF Attachment */}
        <SectionHeader title="PRF Attachment" />
        <View style={styles.borderedBox}>
          {prfAttachment ? (
            <Image source={{ uri: prfAttachment }} style={styles.prfImage} resizeMode="contain" />
          ) : (
            <Text style={styles.helper}>No attachment provided.</Text>
          )}
        </View>

        {/* Venue Required */}
        <SectionHeader title="Venue Required" />
        <View style={styles.borderedBox}>
          <View style={styles.checkboxRow}>
            {venueOptions.map(opt => (
              <Checkbox
                key={opt}
                label={opt}
                checked={safeVenues.includes(opt)}
                onToggle={() => setVenues(toggleValue(opt, safeVenues))}
              />
            ))}
          </View>
          <DocField label="Other Venue / Notes" value={fields.otherVenue} onChange={v => updateField('otherVenue', v)} />
          <DocField label="Number of Chairs Required" value={fields.chairsRequired} keyboardType="number-pad" onChange={v => updateField('chairsRequired', v)} />
        </View>

        {/* Other Requirements */}
        <SectionHeader title="Other Requirements" />
        <View style={styles.borderedBox}>
          <View style={styles.checkboxRow}>
            {requirementOptions.map(opt => (
              <Checkbox
                key={opt}
                label={opt}
                checked={safeRequirements.includes(opt)}
                onToggle={() => setRequirements(toggleValue(opt, safeRequirements))}
              />
            ))}
          </View>
          <DocField label="Other Requirements (Notes)" value={fields.otherRequirements} onChange={v => updateField('otherRequirements', v)} multiline />
        </View>

        {/* Services of Other Institution Required */}
        <SectionHeader title="Services of Other Institution Required" />
        <View style={styles.borderedBox}>
          <View style={styles.segment}>
            <Text style={styles.segmentLabel}>Services Required:</Text>
            {(['Yes', 'No'] as const).map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.segmentBtn, servicesRequired === (option === 'Yes') && styles.segmentBtnActive]}
                onPress={() => setServicesRequired(option === 'Yes')}
              >
                <Text style={[styles.segmentBtnText, servicesRequired === (option === 'Yes') && styles.segmentBtnTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helper}>{selectedServiceCount} service quantities entered</Text>

          {serviceGroups.map(group => (
            <View key={group.title} style={styles.serviceGroup}>
              <View style={styles.serviceGroupHeader}>
                <Text style={styles.serviceGroupTitle}>{group.title}</Text>
                <Text style={styles.serviceGroupCol}>Volunteers</Text>
              </View>
              {group.items.map(item => {
                const key = `${group.title}:${item}`;
                return (
                  <View key={key} style={styles.serviceRow}>
                    <Checkbox
                      label={item}
                      checked={!!String(safeServiceVolunteers[key] || '').trim()}
                      onToggle={() =>
                        setServiceVolunteers(prev => {
                          const current = prev && typeof prev === 'object' ? prev : emptyServiceState();
                          return { ...current, [key]: current[key] ? '' : '1' };
                        })
                      }
                    />
                    <TextInput
                      style={styles.serviceInput}
                      keyboardType="number-pad"
                      placeholderTextColor="#999"
                      value={String(safeServiceVolunteers[key] || '')}
                      onChangeText={value =>
                        setServiceVolunteers(prev => {
                          const current = prev && typeof prev === 'object' ? prev : emptyServiceState();
                          return { ...current, [key]: value };
                        })
                      }
                    />
                  </View>
                );
              })}
            </View>
          ))}
          <DocField label="TKN / Information" value={fields.tkService} onChange={v => updateField('tkService', v)} />
        </View>

        {/* Requester */}
        <SectionHeader title="Requester" />
        <View style={styles.borderedBox}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <DocField label="Requester Name" value={fields.requestorName} onChange={v => updateField('requestorName', v)} />
              <DocField label="Contact Details" value={fields.contactDetails} onChange={v => updateField('contactDetails', v)} />
            </View>
            <View style={styles.col}>
              <Text style={styles.sigLabel}>Signature:</Text>
              <View style={styles.sigLine} />
            </View>
          </View>
        </View>

        {/* Approval Section */}
        <SectionHeader title="Approval Section" />
        <View style={styles.borderedBox}>
          <View style={styles.approvalGrid}>
            {[
              ['Mukhi Saheb', 'mukhiSaheb'],
              ['Kamadia Saheb', 'kamadiaSaheb'],
              ['Director (Gents)', 'directorGent'],
              ['Director (Ladies)', 'directorLadies'],
              ['REC', 'rec'],
              ['Study Circle', 'studyCircle'],
            ].map(([label, fieldKey]) => (
              <View key={fieldKey} style={styles.approvalCell}>
                <Text style={styles.approvalLabel}>{label}</Text>
                <View style={styles.sigLine} />
                <TextInput
                  style={styles.approvalInput}
                  placeholder="Name / Date"
                  placeholderTextColor="#999"
                  value={fields[fieldKey as keyof Fields]}
                  onChangeText={v => updateField(fieldKey as keyof Fields, v)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        {!isReadOnly ? (
        <View style={styles.actions}>
          {!isEditing ? (
            <PrimaryButton
              title="Save Draft"
              variant="secondary"
              loading={saving === 'DRAFT'}
              disabled={!!saving}
              onPress={() => save('DRAFT')}
            />
          ) : null}
          <PrimaryButton
            title={isEditing ? 'Update Request' : 'Submit Request'}
            loading={saving === 'SUBMITTED' || saving === 'APPROVED'}
            disabled={!!saving}
            onPress={() => save(isEditing ? (currentStatus ?? 'SUBMITTED') : 'SUBMITTED')}
          />
        </View>
        ) : null}
      </View>
    </ScreenLayout>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeaderBar}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const DocField: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
  onChange: (v: string) => void;
  style?: any;
}> = ({ label, value, placeholder, keyboardType, multiline, onChange, style }) => (
  <View style={[styles.docField, style]}>
    <Text style={styles.docFieldLabel}>{label}</Text>
    <TextInput
      style={[styles.docFieldInput, multiline && styles.docFieldInputMultiline]}
      placeholder={placeholder}
      placeholderTextColor="#999"
      keyboardType={keyboardType}
      multiline={multiline}
      value={String(value ?? '')}
      onChangeText={onChange}
    />
  </View>
);

const Checkbox: React.FC<{ label: string; checked: boolean; onToggle: () => void }> = ({ label, checked, onToggle }) => (
  <TouchableOpacity style={styles.checkboxItem} onPress={onToggle}>
    <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]} />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollContent: {
    width: '100%',
    paddingBottom: 48,
    paddingHorizontal: 12,
  },
  a4Page: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#000',
    padding: 10,
  },
  headerSection: {
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 6,
  },
  orgKicker: {
    fontSize: 9,
    color: '#333',
  },
  orgTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 2,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
  formInstruction: {
    fontSize: 9,
    color: '#555',
    marginTop: 2,
  },
  sectionHeaderBar: {
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  twoCol: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  col: {
    flex: 1,
    flexShrink: 1,
    padding: 5,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  halfInput: {
    flex: 1,
  },
  docField: {
    marginBottom: 2,
    flexShrink: 1,
  },
  docFieldLabel: {
    fontSize: 9,
    color: '#333',
    marginBottom: 1,
    flexShrink: 1,
  },
  docFieldInput: {
    fontSize: 11,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 2,
    paddingHorizontal: 0,
    color: '#000',
    flex: 1,
  },
  docFieldInputMultiline: {
    borderBottomWidth: 0,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  borderedBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderTopWidth: 0,
    padding: 8,
    gap: 6,
  },
  docTextArea: {
    fontSize: 11,
    minHeight: 70,
    textAlignVertical: 'top',
    padding: 4,
    color: '#000',
  },
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  checkboxBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#000',
  },
  checkboxLabel: {
    fontSize: 10,
    color: '#000',
    flexShrink: 1,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  segmentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  segmentBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  segmentBtnActive: {
    backgroundColor: '#000',
  },
  segmentBtnText: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
  },
  segmentBtnTextActive: {
    color: '#fff',
  },
  helper: {
    fontSize: 9,
    color: '#555',
    marginBottom: 4,
  },
  serviceGroup: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 6,
  },
  serviceGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  serviceGroupTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  serviceGroupCol: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  serviceInput: {
    width: 40,
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 3,
    paddingVertical: 1,
    color: '#000',
    textAlign: 'center',
  },
    prfImage: {
      width: '100%',
      height: 200,
      backgroundColor: '#f5f5f5',
      marginBottom: 6,
    },
    sigLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  sigLine: {
    height: 1,
    backgroundColor: '#000',
    marginBottom: 4,
  },
  approvalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  approvalCell: {
    width: '47%',
    marginBottom: 6,
    flexShrink: 1,
  },
  approvalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  approvalInput: {
    fontSize: 10,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 2,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
});

export default ServiceRequisitionScreen;
