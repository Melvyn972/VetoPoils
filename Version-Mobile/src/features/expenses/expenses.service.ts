import { supabase } from "@/lib/supabase";
import type { Expense, ExpenseCategory } from "@/types/database.types";

export async function fetchExpense(id: string) {
  const { data, error } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Expense | null;
}

export async function fetchExpenses(animalId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("animal_id", animalId)
    .order("date_depense", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createExpense(values: {
  animal_id: string;
  category: ExpenseCategory;
  montant: number;
  cree_par: string;
  description?: string | null;
  date_depense?: string;
  medical_event_id?: string | null;
}) {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      animal_id: values.animal_id,
      category: values.category,
      montant: values.montant,
      cree_par: values.cree_par,
      description: values.description?.trim() || null,
      date_depense: values.date_depense ?? new Date().toISOString().slice(0, 10),
      medical_event_id: values.medical_event_id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(
  id: string,
  values: Partial<Pick<Expense, "category" | "montant" | "description" | "date_depense">>,
) {
  const { data, error } = await supabase
    .from("expenses")
    .update(values)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
