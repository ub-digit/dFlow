require 'rails_helper'

RSpec.configure do |c|
  c.include ModelHelper
end

describe Api::SourcesController do
  before :each do
    config_init
    @api_key = Rails.application.config.api_key
    @libris_source = Source.where(classname: "Libris").first
  end

  describe "GET validate_new_objects" do
    context "one object with valid data" do
      it "should return success message and source id" do
        data = [{source_name: "Libris", catalog_id: 1234}]
        get :validate_new_objects, api_key: @api_key, objects: data
        expect(json['error']).to be nil
        expect(json['data']['catalog_ids'].size).to eq(1)
        expect(json['data']['objects'][0]['source_id']).to eq(@libris_source.id)
      end
    end
    context "objects are empty" do
      it "should return error" do
        data = []
        get :validate_new_objects, api_key: @api_key, objects: data
        expect(json['error']).not_to be nil
      end
      it "should return error with error code REQUEST_ERROR" do
        data = []
        get :validate_new_objects, api_key: @api_key, objects: data
        expect(json['error']['code']).to eq('REQUEST_ERROR')
        expect(json['error']['msg']).to eq('No valid objects are given')
      end
    end
    context "four objects with valid data and two catalog_ids" do
      it "should return success message and source ids" do
        data = [{source_name: "Libris", catalog_id: 1234, name: "First"},
          {source_name: "Libris", catalog_id: 1234, name: "Second"},
          {source_name: "Libris", catalog_id: 1235, name: "Third"},
          {source_name: "Libris", catalog_id: 1235, name: "Fourth"}]
        get :validate_new_objects, api_key: @api_key, objects: data
        expect(json['error']).to be nil
        expect(json['data']['catalog_ids'].size).to eq(2)
        expect(json['data']['objects'][0]['source_id']).to eq(@libris_source.id)
      end
    end
    context "one object with an invalid source" do
      it "should return an error message" do
        data = [{source_name: "Libriss", catalog_id: 1234}]
        get :validate_new_objects, api_key: @api_key, objects: data
        expect(json['error']).to_not be nil
      end
    end
    context "one object with invalid fields" do
      it "should return an error message" do
        data = [{source_name: "Libris", catalog_id: 1234, wrongcolumn: "testing"}]
        get :validate_new_objects, api_key: @api_key, objects: data
        expect(json['error']).to_not be nil
      end
    end
  end
  describe "GET fetch_source_data" do
    context "with invalid attributes" do
      it "returns a json error message" do
        get :fetch_source_data, api_key: @api_key, catalog_id: 1, source_id: 1
        expect(json['error']).to_not be nil
        expect(json['data']).to be nil
      end
    end
    context "with valid attributes" do
      it "Returns object data" do
        get :fetch_source_data, api_key: @api_key, catalog_id: 1234, source_id: 1
        expect(json['error']).to be nil
        expect(json['data']['catalog_id']).to eq('1234')
      end
    end
    context "from no valid source" do
      it "should return error" do
        get :fetch_source_data, api_key: @api_key, catalog_id: 1234, source_id: 0
        expect(json['error']).not_to be nil
      end
      it "should return error with error code OBJECT_ERROR" do
        get :fetch_source_data, api_key: @api_key, catalog_id: 1234, source_id: 0
        expect(json['error']['code']).to eq('OBJECT_ERROR')
        expect(json['error']['msg']).to eq("Could not find a source with id 0")
      end
    end
  end

end