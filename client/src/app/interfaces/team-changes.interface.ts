export interface TeamChange {
  id: number
  table_name: string
  record_id: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: string | null
  new_values: string | null
  changed_by: string
  team_id: number | null
  changed_at: string
}

export interface TeamChangesResponse {
  changes: TeamChange[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
