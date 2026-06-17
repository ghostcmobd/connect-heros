ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;

UPDATE public.profiles p
SET department = arr[((abs(hashtext(p.id::text)) % 10) + 1)]
FROM (SELECT array[
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business',
  'Design',
  'Biology',
  'Mathematics',
  'Economics',
  'Psychology',
  'Physics'
]::text[] AS arr) d
WHERE p.department IS NULL;

CREATE INDEX IF NOT EXISTS profiles_department_idx ON public.profiles(department);