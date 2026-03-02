/* Professional growth: certificates and training courses */
CREATE TABLE IF NOT EXISTS public.professional_growth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('certificate', 'course')),
  title TEXT NOT NULL DEFAULT '',
  image_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_growth_user_id ON public.professional_growth(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_growth_sort ON public.professional_growth(user_id, sort_order);

ALTER TABLE public.professional_growth ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own professional growth" ON public.professional_growth;
CREATE POLICY "Users can view own professional growth"
  ON public.professional_growth FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own professional growth" ON public.professional_growth;
CREATE POLICY "Users can insert own professional growth"
  ON public.professional_growth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own professional growth" ON public.professional_growth;
CREATE POLICY "Users can update own professional growth"
  ON public.professional_growth FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own professional growth" ON public.professional_growth;
CREATE POLICY "Users can delete own professional growth"
  ON public.professional_growth FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_growth TO authenticated;

CREATE OR REPLACE FUNCTION update_professional_growth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS professional_growth_updated_at ON public.professional_growth;
CREATE TRIGGER professional_growth_updated_at
  BEFORE UPDATE ON public.professional_growth
  FOR EACH ROW EXECUTE FUNCTION update_professional_growth_updated_at();

COMMENT ON TABLE public.professional_growth IS 'Certificates and training courses for teachers';
