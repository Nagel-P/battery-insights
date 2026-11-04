import pytest
from app import create_app
from app.services.data_manager import data_manager
@pytest.fixture
def client(tmp_path):
    data_manager._data=None; data_manager.filename=None; data_manager.generation=0
    app=create_app({"TESTING":True,"UPLOAD_FOLDER":tmp_path})
    with app.test_client() as client: yield client
