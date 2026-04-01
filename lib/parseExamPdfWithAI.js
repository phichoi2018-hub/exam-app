${rawText}
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '너는 시험지 데이터를 구조화하는 AI다.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
  });

  let text = response.choices[0].message.content;

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('AI JSON 파싱 실패:', text);
    throw new Error('AI 응답을 JSON으로 변환하지 못했습니다.');
  }
}