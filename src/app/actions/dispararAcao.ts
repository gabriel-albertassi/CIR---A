"use server";

export type ApiResponse =
  | { success: true }
  | { success: false; error: string };

export async function dispararAcao(payload: {
  exemplo: string;
}): Promise<ApiResponse> {
  try {
    // validação simples
    if (!payload?.exemplo) {
      return {
        success: false,
        error: "Dados inválidos",
      };
    }

    // simulação de processamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      error: "Erro interno no servidor",
    };
  }
}
