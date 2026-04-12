import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const t = raw.trim();
  const fence = t.match(/
http://googleusercontent.com/immersive_entry_chip/0
2. 댕댕마켓 웹에서 다시 버튼을 눌러 에러를 냅니다.
3. **Supabase 대시보드 [Logs] 탭**을 확인합니다! 

이번에는 `booted` 주변에 **`🔥 서버 동작 중 에러 발생: OpenAI HTTP 429: ... You exceeded your current quota...`** 같은 빨간색 메시지가 아주 선명하게 찍혀 있을 것입니다.

만약 `quota` 관련 에러가 맞다면 OpenAI API 홈페이지(platform.openai.com)의 [Billing] 메뉴에서 카드를 등록하고 최소 금액($5)을 결제하시면 바로 정상 작동할 것입니다! 로그 내용 확인해보시고 꼭 결과 알려주세요!