// mobile/src/screens/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setErr('Email and password required.');
      return;
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await signUp(email.trim(), password, name.trim() || undefined);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      setErr(
        code === 'auth/email-already-in-use'
          ? 'An account with that email already exists.'
          : code === 'auth/invalid-email'
            ? 'That email looks invalid.'
            : (e?.message || 'Sign up failed.'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <Pressable onPress={() => navigation.goBack()} className="absolute top-12 left-4 p-2">
          <Feather name="arrow-left" size={20} color="#a1a1aa" />
        </Pressable>

        <View className="mb-10">
          <Text className="text-white text-3xl font-bold mb-2">Create account</Text>
          <Text className="text-zinc-400 text-base">Start scheduling in minutes.</Text>
        </View>

        <View className="gap-3">
          <Field label="Name (optional)"  value={name}     onChangeText={setName}     placeholder="Your name" icon="user" />
          <Field label="Email"            value={email}    onChangeText={setEmail}    placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" icon="mail" />
          <Field label="Password"         value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry icon="lock" />
        </View>

        {err && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mt-3">
            <Text className="text-red-300 text-xs">{err}</Text>
          </View>
        )}

        <View className="mt-5">
          <Button label="Create account" onPress={onSubmit} loading={busy} size="lg" />
        </View>

        <Pressable className="mt-6 flex-row justify-center" onPress={() => navigation.navigate('Login')}>
          <Text className="text-zinc-400 text-sm">Already have an account? </Text>
          <Text className="text-[#a855f7] text-sm font-semibold">Sign in</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  autoComplete?: any;
  icon?: keyof typeof Feather.glyphMap;
}

function Field(p: FieldProps) {
  return (
    <View>
      <Text className="text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">{p.label}</Text>
      <View className="flex-row items-center bg-bg-card border border-[#1f1f23] rounded-2xl px-4">
        {p.icon && <Feather name={p.icon} size={16} color="#71717a" style={{ marginRight: 10 }} />}
        <TextInput
          value={p.value}
          onChangeText={p.onChangeText}
          placeholder={p.placeholder}
          placeholderTextColor="#52525b"
          keyboardType={p.keyboardType}
          autoCapitalize={p.autoCapitalize}
          autoComplete={p.autoComplete}
          secureTextEntry={p.secureTextEntry}
          className="flex-1 text-white text-base py-4"
        />
      </View>
    </View>
  );
}
