import { useState } from "react";

const useSelectedCharts = () => {
    const [selectedForm, setSelectedForm] = useState(null)

    const selectCharts = () => {
        setSelectedForm('3');
      }
      return {selectedForm, selectCharts, setSelectedForm}
}

export default useSelectedCharts
