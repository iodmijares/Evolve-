-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile pictures
CREATE POLICY "Public Access for Profile Pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
);
