export const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwcSwmJ-039RcoXYXtfZNuNByDErG61DBDuGuP_B3e050o4IbzpZ-mcK212E2VHvrjwQw/exec";

export async function saveSurveyData(surveyData: any, creatorId: string) {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveSurvey",
        surveyData,
        creatorId
      }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error saving survey:", error);
    return { status: "error", message: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function saveSurveyResponseData(surveyId: string, answers: any, totalWeight: number) {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveResponse",
        surveyId,
        answers,
        totalWeight
      }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error saving response:", error);
    return { status: "error", message: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function fetchSurveyById(surveyId: string) {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getSurvey",
        surveyId
      }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error fetching survey:", error);
    return { status: "error", message: "Error al intentar descargar la encuesta" };
  }
}

export async function fetchDashboardData() {
  try {
    // Usamos text/plain para evitar que el navegador dispare el error de CORS
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "getDashboardData"
      }),
    });

    
    const text = await res.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return { status: "error", message: "No se pudo conectar con la base de datos" };
  }
}

export async function deleteSurveyById(surveyId: string) {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteSurvey", // Debe coincidir con el case del Script
        surveyId: surveyId
      }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error deleting survey:", error);
    return { status: "error", message: "Error de red" };
  }
}