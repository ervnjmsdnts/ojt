import { forms_v1, google } from 'googleapis';
import env from './env';

export async function createAuthClient() {
  const credentialsJSON = Buffer.from(
    env.GOOGLE_CREDENTIALS_B64,
    'base64',
  ).toString('utf8');
  const keyFile = JSON.parse(credentialsJSON);

  const auth = new google.auth.JWT(
    keyFile.client_email,
    undefined,
    keyFile.private_key,
    [
      'https://www.googleapis.com/auth/forms.body.readonly',
      'https://www.googleapis.com/auth/forms.responses.readonly',
      'https://www.googleapis.com/auth/forms.body',
    ],
  );

  await auth.authorize();
  return auth;
}

export async function getFormStructure(auth: any, formId: string) {
  const forms = google.forms({ version: 'v1', auth });

  const res = await forms.forms.get({ formId });
  const form = res.data;

  const questionMap: Record<string, string> = {};

  if (form.items) {
    for (const item of form.items) {
      if (item.questionItem?.question?.questionId && item.title) {
        const qId = item.questionItem.question.questionId;
        const qTitle = item.title;
        questionMap[qId] = qTitle;
      }
    }
  }

  return questionMap;
}

export async function getFormResponses(auth: any, formId: string) {
  const forms = google.forms({ version: 'v1', auth });

  const res = await forms.forms.responses.list({ formId });
  const responses = res.data.responses || [];
  return responses;
}

export async function getFormResponse(
  auth: any,
  formId: string,
  responseId: string,
) {
  const forms = google.forms({ version: 'v1', auth });

  const res = await forms.forms.responses.get({ responseId, formId });

  const response = res.data;

  return response;
}

export function mapResponsesToQuestions(
  responses: forms_v1.Schema$FormResponse[],
  questionMap: Record<string, string>,
) {
  const parsed = [];

  for (const r of responses) {
    const { responseId, lastSubmittedTime, answers, respondentEmail } = r;
    const mappedAnswers: Record<string, string> = {};

    if (answers) {
      for (const [qId, ansObj] of Object.entries(answers)) {
        const questionText = questionMap[qId] || `Unknown Question (${qId})`;

        const textAnswers = ansObj.textAnswers?.answers || [];

        const combinedText = textAnswers.map((a) => a.value).join(', ');
        mappedAnswers[questionText] = combinedText;
      }
    }

    parsed.push({
      responseId,
      lastSubmittedTime,
      respondentEmail,
      answers: mappedAnswers,
    });
  }

  return parsed;
}

export function mapResponseToQuestions(
  response: forms_v1.Schema$FormResponse,
  questionMap: Record<string, string>,
) {
  const parsed = [];

  const { responseId, lastSubmittedTime, answers, respondentEmail } = response;
  const mappedAnswers: Record<string, string> = {};

  if (answers) {
    for (const [qId, ansObj] of Object.entries(answers)) {
      const questionText = questionMap[qId] || `Unknown Question (${qId})`;

      const textAnswers = ansObj.textAnswers?.answers || [];

      const combinedText = textAnswers.map((a) => a.value).join(', ');
      mappedAnswers[questionText] = combinedText;
    }

    parsed.push({
      responseId,
      lastSubmittedTime,
      respondentEmail,
      answers: mappedAnswers,
    });
  }

  return parsed;
}
