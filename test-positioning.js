const regex = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const testText = '@Url.Action("DepartmentDetails", "Department", new { id = 1 })';
console.log('Test text:', testText);
const match = regex.exec(testText);
if (match) {
  console.log('Match found!');
  console.log('Action:', match[1]);
  console.log('Controller:', match[2]);
  console.log('Full match:', match[0]);
  
  // Test the positioning logic
  const fullMatch = match[0];
  const quoteChar = fullMatch.includes('"') ? '"' : "'";
  console.log('Quote char:', quoteChar);
  
  const actionNameWithQuotes = `${quoteChar}${match[1]}${quoteChar}`;
  const controllerNameWithQuotes = `${quoteChar}${match[2]}${quoteChar}`;
  
  console.log('Action with quotes:', actionNameWithQuotes);
  console.log('Controller with quotes:', controllerNameWithQuotes);
  
  const actionStartInMatch = fullMatch.indexOf(actionNameWithQuotes);
  const controllerStartInMatch = fullMatch.indexOf(controllerNameWithQuotes);
  
  console.log('Action start position:', actionStartInMatch);
  console.log('Controller start position:', controllerStartInMatch);
}
