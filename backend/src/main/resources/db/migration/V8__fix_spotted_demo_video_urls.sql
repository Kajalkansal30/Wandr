-- Replace broken Google/Mixkit demo video hosts (often 403 when hotlinked) with working sample MP4s.
UPDATE place_media
SET url = CASE (id % 5)
  WHEN 0 THEN 'https://download.samplelib.com/mp4/sample-5s.mp4'
  WHEN 1 THEN 'https://download.samplelib.com/mp4/sample-10s.mp4'
  WHEN 2 THEN 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4'
  WHEN 3 THEN 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  ELSE 'https://www.w3schools.com/html/mov_bbb.mp4'
END,
thumbnail_url = COALESCE(
  NULLIF(thumbnail_url, ''),
  CASE (id % 5)
    WHEN 0 THEN 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=720&q=80'
    WHEN 1 THEN 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=720&q=80'
    WHEN 2 THEN 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=720&q=80'
    WHEN 3 THEN 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=720&q=80'
    ELSE 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=720&q=80'
  END
)
WHERE media_type = 'VIDEO'
  AND (
    url ILIKE '%gtv-videos-bucket%'
    OR url ILIKE '%ForBigger%'
    OR url ILIKE '%mixkit.co%'
  );
