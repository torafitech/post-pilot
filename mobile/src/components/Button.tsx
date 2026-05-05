// mobile/src/components/Button.tsx
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md',
  disabled, loading, icon,
}: Props) {
  const base = 'flex-row items-center justify-center rounded-2xl';
  const sizes = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
  };
  const variants = {
    primary:   'bg-[#a855f7]',
    secondary: 'bg-[#27272a] border border-[#3f3f46]',
    ghost:     'bg-transparent border border-[#27272a]',
    danger:    'bg-[#ef4444]',
  };
  const textColor = variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-zinc-200';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${isDisabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`${textColor} font-semibold text-sm`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
