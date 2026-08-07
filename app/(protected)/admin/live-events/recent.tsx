import React from "react";

import AdminLiveFeedScreen from "../../../../components/admin/AdminLiveFeedScreen";
import { buildAdminLiveEventsStreamUrl } from "../../../../lib/api/admin";

export default function DbEventsScreen() {
	const streamUrl = React.useMemo(() => buildAdminLiveEventsStreamUrl(), []);

	return <AdminLiveFeedScreen streamUrl={streamUrl} />;
}
