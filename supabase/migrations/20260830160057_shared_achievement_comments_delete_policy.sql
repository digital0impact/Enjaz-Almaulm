-- ميزة: حذف تعليقات الزوار من صفحة التقرير الكامل
-- الجدول أصلاً بلا أي سياسة DELETE، فكانت RLS تمنع الحذف تمامًا لأي
-- مستخدم (بما فيه صاحبة التقرير نفسها). نضيف سياسة تسمح لصاحبة رابط
-- المشاركة (shared_achievements.user_id) وحدها بحذف التعليقات
-- المرتبطة بنفس الرمز (token).

CREATE POLICY "Report owner can delete comments"
  ON shared_achievement_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shared_achievements
      WHERE shared_achievements.token = shared_achievement_comments.token
        AND shared_achievements.user_id = auth.uid()
    )
  );
