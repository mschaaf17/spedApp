import React, { useState } from 'react';
import AddNewAccommodation from '../../../components/AddNewAccommodation/AddNewAccommodation';
import { Button } from 'antd';
import { AccommodationListTable } from '../../../components/Tables/GeneralTables/accommodationListTable';

export default function AccommodationsTab() {
  const [isAccommodationModalOpen, setAccommodationModalOpen] = useState(false);

  return (
    <div>
      <div className='titleSection'>
        <h1 className="title">Accommodations</h1>
      </div>
      {!isAccommodationModalOpen && (
        <Button className='generalButton' onClick={() => setAccommodationModalOpen(true)}>
          Add Accommodation
        </Button>
      )}
      {isAccommodationModalOpen && <AddNewAccommodation onClose={() => setAccommodationModalOpen(false)} />}
      <AccommodationListTable />
    </div>
  );
}
