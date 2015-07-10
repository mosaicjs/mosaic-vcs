# "Version" class

Each version represents a project snapshot. It contains meta-information about 
this version (date, author, checksums etc). It also contains a list of all
resource revisions. It is possible to load a resource revision objects by their
respective paths.

## Methods 

* Revision[] loadAllResources() - gives access to all resource revisions
  in this version.
* Revision[] loadResources(Set<Path> paths) - load revisions for the
  specified paths
* Revision[] loadResourcesByHash(Set<String> hashes) - load resource 
  revisions by their SHA-1 hashes
* Revision[] loadResourcesByPrefix(Path pathPrefix) - loads all
  resources with pathes starting with the specified prefix; if the "deep"
  flag is true then this method returns revisions for all resources
  with the path starting with the specified prefix;
  otherwise it returns only resources contained directly in the specified
  path. 
* Revision[] storeResources(Map<Path, Buffer> revisions, boolean replace);
  Creates and returns new resource revisions using the
  
## "vc_version" table

* long versionId  - PK; internal primary key of this version
* DateTime stamp  - timestamp (in milliseconds);
  defines the creation time of this version
* long metainfoId - reference to the "vc_blob" table 
  with a meta-information object about this version; 

## "vc_version_revisions" table

Associates a project version with individual resource revisions. 
See the [Revision](Revision.md) file for more information.  

                    