import { google } from 'googleapis';

// To use this, you need to set up a Service Account in Google Cloud
// and get the credentials JSON file. Set these environment variables:
// GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY
// along with your target spreadsheet ID: SPREADSHEET_ID

export async function getGoogleSheets() {
  const target = ['https://www.googleapis.com/auth/spreadsheets'];

  const jwt = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    target
  );

  const sheets = google.sheets({ version: 'v4', auth: jwt });
  return sheets;
}

export async function saveSurveyDefinition(spreadsheetId: string, surveyData: any) {
  try {
    const sheets = await getGoogleSheets();

    // We append the JSON stringified version of the survey to keep it simple,
    // or you can map row by row.
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Encuestas_Configuracion!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [surveyData.id || new Date().getTime(), surveyData.title, JSON.stringify(surveyData)]
        ]
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving to sheets:', error);
    return { success: false, error };
  }
}

export async function saveSurveyResponse(spreadsheetId: string, surveyId: string, answers: any, totalWeight: number) {
  try {
    const sheets = await getGoogleSheets();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Respuestas_Usuarios!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [new Date().toISOString(), surveyId, JSON.stringify(answers), totalWeight]
        ]
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error reading from sheets:', error);
    return { success: false, error };
  }
}
