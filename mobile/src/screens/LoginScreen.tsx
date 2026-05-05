// mobile/src/screens/LoginScreen.tsx
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setErr('Email and password required.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      setErr(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Email or password is incorrect.'
          : code === 'auth/user-not-found'
            ? 'No account with that email.'
            : (e?.message || 'Sign in failed.'),
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
        <View className="mb-10">
          <View className="w-14 h-14 rounded-2xl bg-[#a855f7] items-center justify-center mb-6">
            <Feather name="zap" size={26} color="#fff" />
          </View>
          <Text className="text-white text-3xl font-bold mb-2">Welcome back</Text>
          <Text className="text-zinc-400 text-base">Sign in to continue scheduling.</Text>
        </View>

        <View className="gap-3 mb-2">
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon="mail"
          />

          <View>
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!show}
              icon="lock"
              right={
                <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
                  <Feather name={show ? 'eye-off' : 'eye'} size={18} color="#71717a" />
                </Pressable>
              }
            />
          </View>
        </View>

        {err && (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-3 mt-2">
            <Text className="text-red-300 text-xs">{err}</Text>
          </View>
        )}

        <View className="mt-4">
          <Button label="Sign in" onPress={onSubmit} loading={busy} size="lg" />
        </View>

        <Pressable className="mt-6 flex-row justify-center" onPress={() => navigation.navigate('SignUp')}>
          <Text className="text-zinc-400 text-sm">New here? </Text>
          <Text className="text-[#a855f7] text-sm font-semibold">Create an account</Text>
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
  right?: React.ReactNode;
}

function Field(p: FieldProps) {
  return (
    <View>
      <Text className="text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
        {p.label}
      </Text>
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
        {p.right}
      </View>
    </View>
  );
}
