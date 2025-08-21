const regex = /@Url\.Action\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*[^)]+\)/g;
const testText = '@Url.Action("DepartmentDetails", "Department", new { id = 1 })';
console.log('Test text:', testText);
const match = regex.exec(testText);
if (match) {
  console.log('Match found!');
  console.log('Action:', match[1]);
  console.log('Controller:', match[2]);
  console.log('Full match:', match[0]);
} else {
  console.log('No match found');
}
