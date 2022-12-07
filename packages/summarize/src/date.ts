export function inRange(date: Date, since: Date, until: Date) {
  return since.getTime() <= date.getTime() && date.getTime() <= until.getTime();
}
