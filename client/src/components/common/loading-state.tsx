export const LoadingState = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">{label}</div>
)
