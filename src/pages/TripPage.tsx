import { useParams } from 'react-router-dom'
import PagePlaceholder from '../components/PagePlaceholder'

function TripPage() {
  const { tripId } = useParams<{ tripId: string }>()

  return (
    <PagePlaceholder
      title="Trip Page"
      description={`Details for trip ${tripId}.`}
    />
  )
}

export default TripPage
