// part of dslink.historian;
{
    [key, string];
    dynamic;
}
 > getCreateDatabaseParameters();
Future;
store(entries, ValueEntry[]);
Stream < ValuePair > fetchHistory(group, string, path, string, range, TimeRange);
Future;
purgePath(group, string, path, string, range, TimeRange);
Future;
purgeGroup(group, string, range, TimeRange);
Future;
close();
addWatchPathExtensions(node, WatchPathNode);
{ }
addWatchGroupExtensions(node, WatchGroupNode);
{ }
//# sourceMappingURL=adapter.js.map