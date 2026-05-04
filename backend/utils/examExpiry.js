const EXAM_VALIDITY_MS = 24 * 60 * 60 * 1000;

function getExpiryDate(publishedAt = new Date()) {
  return new Date(new Date(publishedAt).getTime() + EXAM_VALIDITY_MS);
}

function isExamExpired(exam, now = new Date()) {
  return exam.status === 'published' && exam.expiresAt && new Date(exam.expiresAt) <= now;
}

async function expirePublishedExams(Exam, now = new Date()) {
  const missingExpiry = await Exam.find({
    status: 'published',
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }]
  });

  await Promise.all(missingExpiry.map(exam => {
    exam.publishedAt = exam.publishedAt || exam.updatedAt || exam.createdAt || now;
    exam.expiresAt = getExpiryDate(exam.publishedAt);
    if (exam.expiresAt <= now) exam.status = 'expired';
    return exam.save();
  }));

  await Exam.updateMany(
    { status: 'published', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  );
}

function prepareStatusUpdate(exam, nextStatus) {
  if (nextStatus === undefined) return;

  const wasPublished = exam.status === 'published';
  exam.status = nextStatus;

  if (nextStatus === 'published' && !wasPublished) {
    exam.publishedAt = new Date();
    exam.expiresAt = getExpiryDate(exam.publishedAt);
  }

  if (nextStatus === 'draft') {
    exam.publishedAt = null;
    exam.expiresAt = null;
  }
}

module.exports = {
  EXAM_VALIDITY_MS,
  expirePublishedExams,
  getExpiryDate,
  isExamExpired,
  prepareStatusUpdate
};
