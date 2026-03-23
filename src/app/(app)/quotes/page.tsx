import { getQuotes } from "@/app/actions-quotes";
import { QuotesList } from "./quotes-list";

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <QuotesList initialQuotes={quotes} />
    </div>
  );
}
