/*
  # Tabla de créditos de usuario

  1. Nueva tabla
    - `user_credits`
      - `user_id` (uuid, primary key)
      - `credits` (integer, default 10)
      - `last_reset` (timestamptz)
      - `updated_at` (timestamptz)

  2. Seguridad
    - Enable RLS
    - Usuarios pueden leer sus propios créditos
    - Solo el sistema puede actualizar créditos (mediante función)

  3. Función
    - Función para verificar y consumir créditos
    - Función para resetear créditos diarios
*/

-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer DEFAULT 10 NOT NULL,
  last_reset timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- User credits policies
CREATE POLICY "Users can read own credits" ON user_credits
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to initialize user credits
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits, last_reset)
  VALUES (NEW.id, 10, now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize credits when user is created
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();

-- Function to check and consume credits
CREATE OR REPLACE FUNCTION consume_credit(p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_credits integer;
  v_last_reset timestamptz;
  v_now timestamptz := now();
BEGIN
  -- Get current credits and last reset
  SELECT credits, last_reset INTO v_credits, v_last_reset
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits, last_reset)
    VALUES (p_user_id, 10, v_now)
    RETURNING credits, last_reset INTO v_credits, v_last_reset;
  END IF;

  -- Reset credits if more than 24 hours have passed
  IF v_now - v_last_reset > interval '24 hours' THEN
    UPDATE user_credits
    SET credits = 10,
        last_reset = v_now,
        updated_at = v_now
    WHERE user_id = p_user_id
    RETURNING credits INTO v_credits;
  END IF;

  -- Check if user has credits
  IF v_credits <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'credits', 0,
      'message', 'No tienes créditos disponibles. Se resetean cada 24 horas.'
    );
  END IF;

  -- Consume one credit
  UPDATE user_credits
  SET credits = credits - 1,
      updated_at = v_now
  WHERE user_id = p_user_id
  RETURNING credits INTO v_credits;

  RETURN json_build_object(
    'success', true,
    'credits', v_credits,
    'message', 'Crédito consumido exitosamente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);