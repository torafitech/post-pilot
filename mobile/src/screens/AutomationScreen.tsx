// mobile/src/screens/AutomationScreen.tsx
// Manage Link Me rules + Auto Reply templates against the existing
// Next.js automation API. Includes Test Now to fire the test-run route.
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform as RNPlatform, Pressable, ScrollView,
  Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlatformIcon } from '@/components/PlatformIcon';
import { api } from '@/lib/api';
import { theme } from '@/lib/theme';
import {
  ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_LABEL, type Platform,
} from '@/lib/platformConfig';

interface LinkMeRule {
  id: string;
  keyword: string;
  replyMessage: string;
  platforms: string[];
  isActive: boolean;
  totalMatches?: number;
}

interface AutoReplyTemplate {
  id: string;
  name: string;
  message: string;
  platforms: string[];
  isActive: boolean;
  useAI?: boolean;
}

type Tab = 'link' | 'reply';

export function AutomationScreen() {
  const [tab, setTab] = useState<Tab>('link');
  const [rules, setRules] = useState<LinkMeRule[]>([]);
  const [tmpls, setTmpls] = useState<AutoReplyTemplate[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, t] = await Promise.all([
        api.get<{ rules: LinkMeRule[] }>('/api/automation/link-me'),
        api.get<{ templates: AutoReplyTemplate[] }>('/api/automation/auto-reply'),
      ]);
      setRules(r.rules || []);
      setTmpls(t.templates || []);
    } catch (err: any) {
      Alert.alert('Could not load automation', err?.message || 'Unknown error.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const onTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.post<{ success: boolean; message: string }>(
        '/api/automation/test-run',
        { type: tab === 'link' ? 'link-me' : 'auto-reply' },
      );
      setTestResult({ ok: !!r.success, message: r.message });
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'Test failed.' });
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 12000);
    }
  };

  const toggleRule = async (rule: LinkMeRule) => {
    const next = !rule.isActive;
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, isActive: next } : r)));
    try {
      await api.patch(`/api/automation/link-me/${rule.id}`, { isActive: next });
    } catch {
      setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, isActive: !next } : r)));
    }
  };

  const toggleTmpl = async (t: AutoReplyTemplate) => {
    const next = !t.isActive;
    setTmpls((ts) => ts.map((x) => (x.id === t.id ? { ...x, isActive: next } : x)));
    try {
      await api.patch(`/api/automation/auto-reply/${t.id}`, { isActive: next });
    } catch {
      setTmpls((ts) => ts.map((x) => (x.id === t.id ? { ...x, isActive: !next } : x)));
    }
  };

  const onDeleteRule = (rule: LinkMeRule) => {
    Alert.alert('Delete rule?', `"${rule.keyword}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setRules((rs) => rs.filter((r) => r.id !== rule.id));
          try { await api.delete(`/api/automation/link-me/${rule.id}`); }
          catch (err: any) { Alert.alert('Error', err?.message); load(); }
        },
      },
    ]);
  };

  const onDeleteTmpl = (t: AutoReplyTemplate) => {
    Alert.alert('Delete template?', `"${t.name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setTmpls((ts) => ts.filter((x) => x.id !== t.id));
          try { await api.delete(`/api/automation/auto-reply/${t.id}`); }
          catch (err: any) { Alert.alert('Error', err?.message); load(); }
        },
      },
    ]);
  };

  const activeCount = tab === 'link'
    ? rules.filter((r) => r.isActive).length
    : tmpls.filter((t) => t.isActive).length;

  return (
    <Screen
      title="Automation"
      subtitle="Auto-engage with comments using rules"
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Tabs */}
      <View className="flex-row bg-bg-card rounded-2xl p-1 mb-5 border border-[#1f1f23]">
        {(['link', 'reply'] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className="flex-1 rounded-xl py-2.5 items-center flex-row justify-center gap-1.5"
              style={{ backgroundColor: active ? theme.brand : 'transparent' }}
            >
              <Feather
                name={t === 'link' ? 'link-2' : 'message-circle'}
                size={14}
                color={active ? '#fff' : theme.textDim}
              />
              <Text className="text-sm font-semibold" style={{ color: active ? '#fff' : theme.textDim }}>
                {t === 'link' ? 'Link Me' : 'Auto Reply'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {testResult && (
        <View
          className="rounded-2xl px-4 py-3 mb-4 border"
          style={{
            backgroundColor: testResult.ok ? '#10b98122' : '#ef444422',
            borderColor:     testResult.ok ? '#10b98155' : '#ef444455',
          }}
        >
          <Text style={{ color: testResult.ok ? '#34d399' : '#f87171' }} className="text-xs">
            {testResult.message}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-base font-semibold">
          {tab === 'link' ? `Rules (${rules.length})` : `Templates (${tmpls.length})`}
        </Text>
        <View className="flex-row gap-2">
          <Button
            label="Test Now"
            onPress={onTest}
            variant="secondary"
            size="sm"
            loading={testing}
            disabled={activeCount === 0}
            icon={<Feather name="play" size={12} color={theme.text} />}
          />
          <Button
            label="Add"
            onPress={() => setShowForm(true)}
            size="sm"
            icon={<Feather name="plus" size={12} color="#fff" />}
          />
        </View>
      </View>

      {tab === 'link'
        ? rules.length === 0
          ? <EmptyState icon="link-2" message="No Link Me rules yet" />
          : rules.map((r) => (
              <RuleCard
                key={r.id}
                rule={r}
                onToggle={() => toggleRule(r)}
                onDelete={() => onDeleteRule(r)}
              />
            ))
        : tmpls.length === 0
          ? <EmptyState icon="message-circle" message="No Auto Reply templates yet" />
          : tmpls.map((t) => (
              <TmplCard
                key={t.id}
                template={t}
                onToggle={() => toggleTmpl(t)}
                onDelete={() => onDeleteTmpl(t)}
              />
            ))
      }

      {showForm && (
        tab === 'link'
          ? <LinkMeForm onClose={() => setShowForm(false)} onSaved={(r) => { setRules((rs) => [r, ...rs]); setShowForm(false); }} />
          : <AutoReplyForm onClose={() => setShowForm(false)} onSaved={(t) => { setTmpls((ts) => [t, ...ts]); setShowForm(false); }} />
      )}
    </Screen>
  );
}

// ── components ──────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: keyof typeof Feather.glyphMap; message: string }) {
  return (
    <View className="bg-bg-card border border-dashed border-[#27272a] rounded-2xl p-10 items-center">
      <Feather name={icon} size={28} color={theme.textMuted} />
      <Text className="text-zinc-400 text-sm mt-3">{message}</Text>
    </View>
  );
}

function RuleCard({ rule, onToggle, onDelete }: { rule: LinkMeRule; onToggle: () => void; onDelete: () => void }) {
  return (
    <View
      className="bg-bg-card border rounded-2xl p-4 mb-3"
      style={{ borderColor: '#1f1f23', opacity: rule.isActive ? 1 : 0.55 }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-2 flex-wrap">
            <View className="px-2 py-0.5 rounded-full bg-[#a855f7]/15">
              <Text className="text-[#c084fc] text-xs font-mono font-bold">"{rule.keyword}"</Text>
            </View>
            {(rule.totalMatches ?? 0) > 0 && (
              <Text className="text-zinc-600 text-xs">{rule.totalMatches} matches</Text>
            )}
          </View>
          <Text className="text-zinc-300 text-sm" numberOfLines={2}>{rule.replyMessage}</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable onPress={onToggle} hitSlop={6}>
            <Feather
              name={rule.isActive ? 'toggle-right' : 'toggle-left'}
              size={26}
              color={rule.isActive ? theme.brand : theme.textMuted}
            />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6}>
            <Feather name="trash-2" size={16} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-1.5 mt-2">
        {rule.platforms.map((p) => (
          <View key={p} className="flex-row items-center gap-1 bg-[#17171a] px-2 py-0.5 rounded-md">
            <PlatformIcon platform={p} size={10} />
            <Text className="text-zinc-400 text-[11px]">{PLATFORM_LABEL[p as Platform] || p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TmplCard({ template, onToggle, onDelete }: { template: AutoReplyTemplate; onToggle: () => void; onDelete: () => void }) {
  return (
    <View
      className="bg-bg-card border rounded-2xl p-4 mb-3"
      style={{ borderColor: '#1f1f23', opacity: template.isActive ? 1 : 0.55 }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-white text-sm font-semibold">{template.name}</Text>
            {template.useAI && (
              <View className="flex-row items-center gap-1 bg-[#22d3ee]/15 px-2 py-0.5 rounded-full">
                <Feather name="zap" size={10} color="#22d3ee" />
                <Text className="text-[#22d3ee] text-[10px] font-bold uppercase">AI</Text>
              </View>
            )}
          </View>
          {!template.useAI && template.message && (
            <Text className="text-zinc-300 text-sm" numberOfLines={2}>{template.message}</Text>
          )}
          {template.useAI && (
            <Text className="text-zinc-500 text-sm italic">AI-generated replies per comment</Text>
          )}
        </View>
        <View className="flex-row gap-2">
          <Pressable onPress={onToggle} hitSlop={6}>
            <Feather
              name={template.isActive ? 'toggle-right' : 'toggle-left'}
              size={26}
              color={template.isActive ? '#22d3ee' : theme.textMuted}
            />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6}>
            <Feather name="trash-2" size={16} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-1.5 mt-2">
        {template.platforms.map((p) => (
          <View key={p} className="flex-row items-center gap-1 bg-[#17171a] px-2 py-0.5 rounded-md">
            <PlatformIcon platform={p} size={10} />
            <Text className="text-zinc-400 text-[11px]">{PLATFORM_LABEL[p as Platform] || p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── inline forms ────────────────────────────────────────────────────────

function LinkMeForm({ onClose, onSaved }: { onClose: () => void; onSaved: (r: LinkMeRule) => void }) {
  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (!keyword.trim() || !reply.trim() || platforms.length === 0) return;
    setBusy(true);
    try {
      const rule = await api.post<LinkMeRule>('/api/automation/link-me', {
        keyword: keyword.trim(),
        replyMessage: reply.trim(),
        platforms,
      });
      onSaved(rule);
    } catch (err: any) {
      Alert.alert('Could not save', err?.message);
    } finally {
      setBusy(false);
    }
  };

  return <FormSheet onClose={onClose} title="New Link Me rule">
    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Keyword</Text>
    <TextInput
      value={keyword}
      onChangeText={setKeyword}
      placeholder='e.g. "link", "info"'
      placeholderTextColor={theme.textMuted}
      className="bg-[#17171a] border border-[#1f1f23] rounded-xl px-4 py-3 text-white text-sm mb-4"
    />
    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Reply message</Text>
    <TextInput
      value={reply}
      onChangeText={setReply}
      placeholder="Here's the link you asked for…"
      placeholderTextColor={theme.textMuted}
      multiline
      className="bg-[#17171a] border border-[#1f1f23] rounded-xl px-4 py-3 text-white text-sm min-h-[80px] mb-4"
      textAlignVertical="top"
    />
    <PlatformSelector value={platforms} onChange={setPlatforms} />
    <Button
      label="Save rule"
      onPress={onSave}
      loading={busy}
      disabled={!keyword.trim() || !reply.trim() || platforms.length === 0}
      size="lg"
    />
  </FormSheet>;
}

function AutoReplyForm({ onClose, onSaved }: { onClose: () => void; onSaved: (t: AutoReplyTemplate) => void }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (!name.trim() || (!useAI && !message.trim()) || platforms.length === 0) return;
    setBusy(true);
    try {
      const t = await api.post<AutoReplyTemplate>('/api/automation/auto-reply', {
        name: name.trim(),
        message: message.trim(),
        platforms,
        useAI,
      });
      onSaved(t);
    } catch (err: any) {
      Alert.alert('Could not save', err?.message);
    } finally {
      setBusy(false);
    }
  };

  return <FormSheet onClose={onClose} title="New Auto Reply template">
    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Name</Text>
    <TextInput
      value={name}
      onChangeText={setName}
      placeholder="e.g. Friendly welcome"
      placeholderTextColor={theme.textMuted}
      className="bg-[#17171a] border border-[#1f1f23] rounded-xl px-4 py-3 text-white text-sm mb-4"
    />

    <Pressable
      onPress={() => setUseAI((v) => !v)}
      className="bg-[#17171a] border border-[#1f1f23] rounded-xl px-4 py-3 mb-4 flex-row items-center"
    >
      <View
        className="w-10 h-6 rounded-full mr-3 justify-center"
        style={{ backgroundColor: useAI ? theme.accent : '#3f3f46', paddingHorizontal: 2 }}
      >
        <View
          className="w-5 h-5 rounded-full bg-white"
          style={{ alignSelf: useAI ? 'flex-end' : 'flex-start' }}
        />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-medium">AI-generated replies</Text>
        <Text className="text-zinc-500 text-xs mt-0.5">Crafts unique replies based on each comment</Text>
      </View>
    </Pressable>

    {!useAI && (
      <>
        <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
          Reply message — use {'{username}'} for personalization
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Thanks {username}!"
          placeholderTextColor={theme.textMuted}
          multiline
          className="bg-[#17171a] border border-[#1f1f23] rounded-xl px-4 py-3 text-white text-sm min-h-[80px] mb-4"
          textAlignVertical="top"
        />
      </>
    )}

    <PlatformSelector value={platforms} onChange={setPlatforms} />
    <Button
      label="Save template"
      onPress={onSave}
      loading={busy}
      disabled={!name.trim() || (!useAI && !message.trim()) || platforms.length === 0}
      size="lg"
    />
  </FormSheet>;
}

function FormSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
      className="absolute inset-0 bg-black/60 z-50"
    >
      <Pressable className="absolute inset-0" onPress={onClose} />
      <View className="absolute left-0 right-0 bottom-0 bg-bg-card rounded-t-3xl border-t border-[#1f1f23] p-5 max-h-[90%]">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-bold">{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={20} color={theme.textDim} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function PlatformSelector({ value, onChange }: { value: Platform[]; onChange: (v: Platform[]) => void }) {
  const toggle = (p: Platform) => {
    if (!ENABLED_PLATFORMS.has(p)) return;
    onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  };
  return (
    <View className="mb-4">
      <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Platforms</Text>
      <View className="flex-row flex-wrap gap-2">
        {ALL_PLATFORMS.map((p) => {
          const enabled = ENABLED_PLATFORMS.has(p);
          const active = value.includes(p);
          return (
            <Pressable
              key={p}
              onPress={() => toggle(p)}
              disabled={!enabled}
              className="rounded-xl px-3 py-2 flex-row items-center gap-1.5 border"
              style={{
                backgroundColor: !enabled ? '#0d0d10' : active ? `${theme.brand}22` : '#17171a',
                borderColor:     !enabled ? '#1f1f23' : active ? `${theme.brand}88` : '#1f1f23',
                opacity: !enabled ? 0.55 : 1,
              }}
            >
              <PlatformIcon platform={p} size={12} />
              <Text className="text-xs" style={{ color: active ? theme.text : theme.textDim }}>
                {PLATFORM_LABEL[p]}
              </Text>
              {!enabled && <Feather name="lock" size={10} color={theme.amber} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
