'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userProfileSchema, type UserProfileInput } from '@/types/schemas';
import { useUpdateProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'New to open source' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: '1-5 PRs merged' },
  { value: 'ADVANCED', label: 'Advanced', description: '5+ PRs merged' },
] as const;

const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C#',
  'Ruby',
  'PHP',
  'Swift',
  'Kotlin',
  'C++',
];

interface ProfileFormProps {
  defaultValues: {
    skillLevel: string;
    preferredLanguages: string[];
    bio: string | null;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      skillLevel: defaultValues.skillLevel as UserProfileInput['skillLevel'],
      preferredLanguages: defaultValues.preferredLanguages,
      bio: defaultValues.bio || '',
    },
  });

  const selectedLanguages = watch('preferredLanguages');

  const toggleLanguage = (lang: string) => {
    const current = selectedLanguages || [];
    const updated = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    setValue('preferredLanguages', updated, { shouldDirty: true });
  };

  const onSubmit = (data: UserProfileInput) => {
    updateProfile.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Skill Level */}
      <div>
        <label className="mb-3 block text-xs font-medium text-muted-foreground">Experience Level</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {SKILL_LEVELS.map((level) => (
            <label
              key={level.value}
              className={cn(
                'cursor-pointer rounded-lg border p-3 transition-all',
                watch('skillLevel') === level.value
                  ? 'border-foreground bg-secondary'
                  : 'border-border hover:border-foreground/20',
              )}
            >
              <input
                type="radio"
                value={level.value}
                {...register('skillLevel')}
                className="sr-only"
              />
              <p className="text-sm font-medium">{level.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{level.description}</p>
            </label>
          ))}
        </div>
        {errors.skillLevel && (
          <p className="mt-1 text-[11px] text-destructive">{errors.skillLevel.message}</p>
        )}
      </div>

      {/* Preferred Languages */}
      <div>
        <label className="mb-3 block text-xs font-medium text-muted-foreground">
          Preferred Languages
          <span className="ml-1 text-muted-foreground/60">(up to 10)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium transition-all',
                selectedLanguages?.includes(lang)
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {lang}
            </button>
          ))}
        </div>
        {errors.preferredLanguages && (
          <p className="mt-1 text-[11px] text-destructive">{errors.preferredLanguages.message}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">Bio</label>
        <textarea
          {...register('bio')}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          placeholder="Tell us about yourself..."
        />
        {errors.bio && <p className="mt-1 text-[11px] text-destructive">{errors.bio.message}</p>}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!isDirty || updateProfile.isPending}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:opacity-90 disabled:opacity-40"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save'}
        </button>

        {updateProfile.isSuccess && (
          <p className="text-xs text-success">Saved successfully</p>
        )}
      </div>
    </form>
  );
}
