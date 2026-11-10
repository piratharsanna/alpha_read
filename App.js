import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const ALPHABET = [
  ['A', 'Apple', '🍎'], ['B', 'Ball', '⚽'], ['C', 'Cat', '🐱'],
  ['D', 'Dog', '🐶'], ['E', 'Elephant', '🐘'], ['F', 'Fish', '🐠'],
  ['G', 'Giraffe', '🦒'], ['H', 'House', '🏠'], ['I', 'Ice cream', '🍦'],
  ['J', 'Juice', '🧃'], ['K', 'Kite', '🪁'], ['L', 'Lion', '🦁'],
  ['M', 'Moon', '🌙'], ['N', 'Nest', '🪺'], ['O', 'Owl', '🦉'],
  ['P', 'Pizza', '🍕'], ['Q', 'Queen', '👑'], ['R', 'Rainbow', '🌈'],
  ['S', 'Sun', '☀️'], ['T', 'Tiger', '🐯'], ['U', 'Umbrella', '☂️'],
  ['V', 'Violin', '🎻'], ['W', 'Whale', '🐳'], ['X', 'Xylophone', '🎶'],
  ['Y', 'Yo-yo', '🪀'], ['Z', 'Zebra', '🦓'],
];
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const COLORS = ['#FFE6EE', '#FFF0D7', '#E9E4FF', '#DDF7F0', '#E0F0FF', '#FCE4FA'];
const STORAGE_KEY = '@alpharead/preferences-v1';

function findProfileVoice(voices, profile) {
  const patterns = profile === 'boy' ? /male|man|boy/i : /female|woman|girl/i;
  return voices.find((voice) => patterns.test(`${voice.name || ''} ${voice.identifier || ''}`));
}

export default function App() {
  const [heard, setHeard] = useState(new Set());
  const [profile, setProfile] = useState('girl');
  const [filter, setFilter] = useState('all');
  const [voices, setVoices] = useState([]);
  const [voiceModal, setVoiceModal] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [saved, available] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          Speech.getAvailableVoicesAsync().catch(() => []),
        ]);
        if (!mounted) return;
        if (saved) {
          const parsed = JSON.parse(saved);
          setHeard(new Set(Array.isArray(parsed.heard) ? parsed.heard : []));
          setProfile(parsed.profile === 'boy' ? 'boy' : 'girl');
        }
        setVoices(Array.isArray(available) ? available : []);
      } catch (_error) {
        // Learning still works if device storage or voice enumeration is unavailable.
      } finally {
        if (mounted) setReady(true);
      }
    }
    load();
    return () => { mounted = false; Speech.stop(); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ heard: [...heard], profile })).catch(() => {});
  }, [heard, profile, ready]);

  const visibleLetters = useMemo(() => ALPHABET.filter(([letter]) => {
    if (filter === 'vowels') return VOWELS.has(letter);
    if (filter === 'heard') return heard.has(letter);
    return true;
  }), [filter, heard]);

  function speakLetter(letter, word) {
    setCurrent({ letter, word });
    setHeard((previous) => new Set(previous).add(letter));
    if (!soundOn) return;
    Speech.stop();
    const matchingVoice = findProfileVoice(voices, profile);
    Speech.speak(`${letter}. ${letter} is for ${word}!`, {
      language: matchingVoice?.language || 'en-US',
      voice: matchingVoice?.identifier,
      rate: 0.82,
      // A child-friendly pitch style; actual voice choices depend on device-installed voices.
      pitch: profile === 'boy' ? 0.88 : 1.12,
    });
  }

  function resetProgress() {
    Alert.alert('Start fresh?', 'Your heard-letter progress will be cleared.', [
      { text: 'Keep learning', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { setHeard(new Set()); setCurrent(null); } },
    ]);
  }

  const progress = Math.round((heard.size / ALPHABET.length) * 100);

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#F15C91" /><Text style={styles.loadingText}>Getting your letters ready…</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9FC" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
            <Text style={styles.brand}>alpha<Text style={styles.brandPink}>read</Text></Text>
          </View>
          <Pressable onPress={() => setSoundOn((value) => !value)} style={styles.soundButton} accessibilityRole="button" accessibilityLabel={soundOn ? 'Turn sound off' : 'Turn sound on'}>
            <Text style={styles.soundIcon}>{soundOn ? '🔊' : '🔇'}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.sparkle}>✨  LITTLE LEARNER CLUB  ✨</Text>
          <Text style={styles.heroTitle}>Let’s learn our{ '\n' }ABCs!</Text>
          <Text style={styles.heroCopy}>Tap a letter and listen to it say hello! 👋</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            <Text style={styles.progressLabel}>{heard.size} / 26</Text>
          </View>
          <Text style={styles.progressCaption}>letters explored</Text>
        </View>

        <View style={styles.voiceCard}>
          <View style={styles.voiceEmoji}><Text style={{ fontSize: 24 }}>{profile === 'boy' ? '👦' : '👧'}</Text></View>
          <View style={styles.voiceCopy}>
            <Text style={styles.voiceTitle}>My reading buddy</Text>
            <Text style={styles.voiceSubtitle}>{profile === 'boy' ? 'Boy-style voice' : 'Girl-style voice'}</Text>
          </View>
          <Pressable onPress={() => setVoiceModal(true)} style={styles.changeButton} accessibilityRole="button">
            <Text style={styles.changeButtonText}>Choose</Text>
          </Pressable>
        </View>

        <View style={styles.storiesHeading}>
          <Text style={styles.sectionTitle}>Say hi to the letters</Text>
          <Text style={styles.hint}>Tap to hear a friend</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
          {ALPHABET.slice(0, 8).map(([letter, word], index) => (
            <Pressable key={letter} onPress={() => speakLetter(letter, word)} style={styles.story} accessibilityRole="button" accessibilityLabel={`Hear ${letter}, ${word}`}>
              <View style={[styles.storyRing, { backgroundColor: COLORS[index % COLORS.length] }]}><Text style={styles.storyLetter}>{letter}</Text></View>
              <Text style={styles.storyWord} numberOfLines={1}>{word}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.gridHeading}>
          <Text style={styles.sectionTitle}>Pick a letter</Text>
          <Text style={styles.hint}>🔈 Tap to listen</Text>
        </View>
        <View style={styles.filters}>
          {[['all', 'All'], ['vowels', 'Vowels'], ['heard', 'Heard']].map(([value, label]) => (
            <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterButton, filter === value && styles.filterActive]} accessibilityRole="button" accessibilityState={{ selected: filter === value }}>
              <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.grid}>
          {visibleLetters.length === 0 ? (
            <View style={styles.emptyState}><Text style={styles.emptyEmoji}>💖</Text><Text style={styles.emptyText}>Tap a letter to meet your first friend!</Text></View>
          ) : visibleLetters.map(([letter, word, emoji], index) => (
            <Pressable key={letter} onPress={() => speakLetter(letter, word)} style={({ pressed }) => [styles.letterCard, { backgroundColor: COLORS[index % COLORS.length] }, pressed && styles.cardPressed]} accessibilityRole="button" accessibilityLabel={`Hear ${letter}, ${letter} is for ${word}${heard.has(letter) ? ', already explored' : ''}`}>
              {heard.has(letter) && <Text style={styles.checkmark}>✓</Text>}
              <Text style={styles.objectEmoji}>{emoji}</Text>
              <Text style={styles.letterText}>{letter}<Text style={styles.lowercaseText}>{letter.toLowerCase()}</Text></Text>
              <Text style={styles.wordText}>{word}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.nowPlaying}>
          <View style={styles.playBadge}><Text style={styles.playBadgeText}>▶</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nowTitle}>{current ? `${current.letter} is for ${current.word}!` : 'Ready when you are!'}</Text>
            <Text style={styles.nowCopy}>{current ? (soundOn ? 'Great listening! Pick another letter.' : 'Sound is off. Turn it on to listen.') : 'Choose any letter to begin.'}</Text>
          </View>
          <Text style={{ fontSize: 21 }}>🌟</Text>
        </View>

        <Pressable onPress={resetProgress} style={styles.resetButton} accessibilityRole="button">
          <Text style={styles.resetText}>Start practice again</Text>
        </Pressable>
        <Text style={styles.footer}>Made for curious little learners 💜</Text>
      </ScrollView>

      <Modal visible={voiceModal} transparent animationType="fade" onRequestClose={() => setVoiceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setVoiceModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalEmoji}>🎤</Text>
            <Text style={styles.modalTitle}>Choose your reading buddy</Text>
            <Text style={styles.modalHint}>Try both and pick the voice you like best!</Text>
            {[
              ['boy', '👦', 'Boy-style voice'],
              ['girl', '👧', 'Girl-style voice'],
            ].map(([value, emoji, label]) => (
              <Pressable key={value} onPress={() => { setProfile(value); setVoiceModal(false); }} style={[styles.voiceOption, profile === value && styles.voiceOptionActive]} accessibilityRole="button" accessibilityState={{ selected: profile === value }}>
                <Text style={{ fontSize: 27 }}>{emoji}</Text>
                <Text style={styles.voiceOptionText}>{label}</Text>
                {profile === value && <Text style={styles.optionCheck}>✓</Text>}
              </Pressable>
            ))}
            <Text style={styles.deviceNote}>Voice sound depends on the voices installed on your phone. You can also change voices in your device settings.</Text>
            <Pressable onPress={() => setVoiceModal(false)} style={styles.doneButton}><Text style={styles.doneText}>All done!</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9FC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9FC', gap: 12 },
  loadingText: { color: '#716B7D', fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 18, paddingBottom: 32, maxWidth: 620, width: '100%', alignSelf: 'center' },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 35, height: 35, borderRadius: 13, backgroundColor: '#F15C91', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontSize: 21, fontWeight: '900' },
  brand: { color: '#282335', fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  brandPink: { color: '#E9518B' },
  soundButton: { width: 42, height: 42, backgroundColor: '#F0EAFE', borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  soundIcon: { fontSize: 19 },
  hero: { overflow: 'hidden', marginTop: 10, padding: 21, borderRadius: 25, backgroundColor: '#EE629D' },
  sparkle: { color: '#FFF4C7', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  heroTitle: { marginTop: 10, color: '#fff', fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1 },
  heroCopy: { marginTop: 8, color: '#FFF5FA', fontSize: 14, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 17 },
  progressTrack: { flex: 1, height: 9, backgroundColor: '#ffffff55', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFE47A', borderRadius: 8 },
  progressLabel: { color: '#fff', fontWeight: '900', fontSize: 13 },
  progressCaption: { marginTop: 5, marginLeft: 1, color: '#FFF3F8', fontSize: 10, fontWeight: '600' },
  voiceCard: { marginTop: 14, padding: 12, borderRadius: 19, backgroundColor: '#F1ECFF', flexDirection: 'row', alignItems: 'center', gap: 11 },
  voiceEmoji: { width: 47, height: 47, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  voiceCopy: { flex: 1 },
  voiceTitle: { color: '#302942', fontSize: 13, fontWeight: '850' },
  voiceSubtitle: { marginTop: 3, color: '#837A96', fontSize: 11, fontWeight: '600' },
  changeButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: '#8D65E8' },
  changeButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  storiesHeading: { marginTop: 22, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { color: '#292538', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  hint: { color: '#928B9D', fontSize: 10, fontWeight: '600' },
  stories: { paddingTop: 13, paddingBottom: 3, gap: 13 },
  story: { width: 63, alignItems: 'center' },
  storyRing: { width: 59, height: 59, borderRadius: 30, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#43334C', shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  storyLetter: { color: '#7252C4', fontSize: 24, fontWeight: '900' },
  storyWord: { maxWidth: 63, marginTop: 5, color: '#716B7D', fontSize: 9, fontWeight: '700' },
  gridHeading: { marginTop: 20, marginBottom: 11, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  filterButton: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, backgroundColor: '#F4F1F7' },
  filterActive: { backgroundColor: '#332A45' },
  filterText: { color: '#756E82', fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'space-between' },
  letterCard: { width: '23%', minWidth: 68, flexGrow: 1, flexBasis: '20%', minHeight: 116, paddingVertical: 9, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF', shadowColor: '#403253', shadowOpacity: 0.07, shadowRadius: 5, elevation: 1 },
  cardPressed: { transform: [{ scale: 0.94 }] },
  checkmark: { position: 'absolute', top: 6, right: 9, color: '#2BA77B', fontSize: 12, fontWeight: '900' },
  objectEmoji: { fontSize: 22 },
  letterText: { marginTop: 2, color: '#403452', fontSize: 30, lineHeight: 34, fontWeight: '900' },
  lowercaseText: { color: '#81768E', fontSize: 17, fontWeight: '700' },
  wordText: { marginTop: 1, color: '#777083', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  emptyState: { width: '100%', alignItems: 'center', padding: 25, borderRadius: 18, backgroundColor: '#F8F3FF' },
  emptyEmoji: { fontSize: 30 },
  emptyText: { marginTop: 7, color: '#716B7D', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  nowPlaying: { marginTop: 16, padding: 13, borderRadius: 18, backgroundColor: '#F2EDFF', flexDirection: 'row', alignItems: 'center', gap: 11 },
  playBadge: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#8B64E8', alignItems: 'center', justifyContent: 'center' },
  playBadgeText: { color: '#fff', fontSize: 14 },
  nowTitle: { color: '#352C47', fontSize: 12, fontWeight: '900' },
  nowCopy: { marginTop: 3, color: '#867E94', fontSize: 10 },
  resetButton: { alignSelf: 'center', marginTop: 14, padding: 8 },
  resetText: { color: '#9A91A6', fontSize: 11, fontWeight: '700', textDecorationLine: 'underline' },
  footer: { marginTop: 8, color: '#B1AABA', textAlign: 'center', fontSize: 10, fontWeight: '600' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22, backgroundColor: '#211B30AA' },
  modalCard: { width: '100%', maxWidth: 390, padding: 22, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center' },
  modalEmoji: { fontSize: 32 },
  modalTitle: { marginTop: 8, color: '#302942', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  modalHint: { marginTop: 6, marginBottom: 16, color: '#867E94', fontSize: 12, textAlign: 'center' },
  voiceOption: { width: '100%', padding: 12, marginTop: 8, borderRadius: 17, backgroundColor: '#F7F4FA', borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceOptionActive: { borderColor: '#AC8AF2', backgroundColor: '#F4EFFF' },
  voiceOptionText: { flex: 1, color: '#393148', fontSize: 14, fontWeight: '800' },
  optionCheck: { color: '#7551CD', fontSize: 18, fontWeight: '900' },
  deviceNote: { marginTop: 14, color: '#91899B', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  doneButton: { width: '100%', alignItems: 'center', marginTop: 17, padding: 13, borderRadius: 16, backgroundColor: '#ED6099' },
  doneText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
