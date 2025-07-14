-- Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', false, 52428800, ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-files', 'user-files', false, 104857600, ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 10485760, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 104857600, ARRAY['application/json', 'text/*'])
ON CONFLICT (id) DO NOTHING;

-- Create Storage Policies for attachments
CREATE POLICY "Users can upload attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own attachments" ON storage.objects
FOR UPDATE USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own attachments" ON storage.objects
FOR DELETE USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

-- Create Storage Policies for user-files
CREATE POLICY "Users can upload user files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own user files" ON storage.objects
FOR SELECT USING (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own user files" ON storage.objects
FOR UPDATE USING (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own user files" ON storage.objects
FOR DELETE USING (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

-- Create Storage Policies for profile-images
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

-- Create Storage Policies for documents
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Create Storage Policies for backups
CREATE POLICY "Users can upload backups" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own backups" ON storage.objects
FOR SELECT USING (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own backups" ON storage.objects
FOR UPDATE USING (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own backups" ON storage.objects
FOR DELETE USING (bucket_id = 'backups' AND auth.uid() IS NOT NULL); 