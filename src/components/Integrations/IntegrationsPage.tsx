import { useState, useEffect } from "react";
import {
  Plus,
  Database,
  Trash2,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Integration {
  id: string;
  integration_type: string;
  connection_name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

const integrationTypes = [
  { value: "sap_b1", label: "SAP Business One", icon: "🔷" },
  { value: "mssql", label: "Microsoft SQL Server", icon: "💾" },
  { value: "postgresql", label: "PostgreSQL", icon: "🐘" },
  { value: "mysql", label: "MySQL", icon: "🐬" },
  { value: "oracle", label: "Oracle Database", icon: "🔴" },
];

export function IntegrationsPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    integration_type: "sap_b1",
    connection_name: "",
    host: "",
    port: 1433,
    database_name: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading integrations:", error);
      return;
    }

    setIntegrations(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("integrations")
          .update({
            integration_type: formData.integration_type,
            connection_name: formData.connection_name,
            host: formData.host,
            port: formData.port,
            database_name: formData.database_name,
            username: formData.username,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("integrations").insert({
          user_id: user.id,
          integration_type: formData.integration_type,
          connection_name: formData.connection_name,
          host: formData.host,
          port: formData.port,
          database_name: formData.database_name,
          username: formData.username,
        });

        if (error) throw error;
      }

      await loadIntegrations();
      resetForm();
    } catch (error) {
      console.error("Error saving integration:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (integration: Integration) => {
    setFormData({
      integration_type: integration.integration_type,
      connection_name: integration.connection_name,
      host: integration.host,
      port: integration.port,
      database_name: integration.database_name,
      username: integration.username,
      password: "",
    });
    setEditingId(integration.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) return;

    const { error } = await supabase.from("integrations").delete().eq("id", id);

    if (error) {
      console.error("Error deleting integration:", error);
      return;
    }

    await loadIntegrations();
  };

  const resetForm = () => {
    setFormData({
      integration_type: "sap_b1",
      connection_name: "",
      host: "",
      port: 1433,
      database_name: "",
      username: "",
      password: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Database Integrations
          </h1>
          <p className="text-slate-600">
            Connect your enterprise databases to enable AI-powered queries and
            insights
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Integration
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingId ? "Edit Integration" : "New Integration"}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Database Type
                  </label>
                  <select
                    value={formData.integration_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        integration_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    required
                  >
                    {integrationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Connection Name
                  </label>
                  <input
                    type="text"
                    value={formData.connection_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        connection_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Production SAP"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Host
                  </label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="localhost or IP address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        port: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={formData.database_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        database_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="SBODemoUS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="sa"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder={
                      editingId
                        ? "Leave blank to keep current password"
                        : "••••••••"
                    }
                    required={!editingId}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingId ? "Update Integration" : "Save Integration"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-lg font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Security Note:</strong> Credentials are stored
                  securely. For production use, ensure your database is properly
                  secured and uses encrypted connections.
                </p>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {integrations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No Integrations Yet
              </h3>
              <p className="text-slate-600 mb-4">
                Add your first database connection to start querying with AI
              </p>
            </div>
          ) : (
            integrations.map((integration) => {
              const type = integrationTypes.find(
                (t) => t.value === integration.integration_type
              );
              return (
                <div
                  key={integration.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-3 rounded-lg">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {integration.connection_name}
                          </h3>
                          {integration.is_active ? (
                            <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {type?.icon} {type?.label}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Host:</span>
                            <p className="font-medium text-slate-800">
                              {integration.host}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Port:</span>
                            <p className="font-medium text-slate-800">
                              {integration.port}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Database:</span>
                            <p className="font-medium text-slate-800">
                              {integration.database_name}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Username:</span>
                            <p className="font-medium text-slate-800">
                              {integration.username}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(integration)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(integration.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
